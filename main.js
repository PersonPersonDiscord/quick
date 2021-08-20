document.addEventListener("error", function(event) {
  alert(event.message + " (" + event.lineno + event.colno + ")");
});

let setup, draw;

(function() {

let canvas = document.createElement("canvas");
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let gl = canvas.getContext("webgl");

function createShader(source, type) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(shader);
  }
  return shader;
}

function createProgram(vertex_source, fragment_source) {
  let program = gl.createProgram();
  let vertex_shader = createShader(vertex_source, gl.VERTEX_SHADER);
  let fragment_shader = createShader(fragment_source, gl.FRAGMENT_SHADER);
  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw gl.getProgramInfoLog(program);
  }
  return program;
}

function createQuadBuffer(vertices) {
  let vertexPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  vertexPosBuffer.itemSize = 2;
  vertexPosBuffer.itemType = gl.FLOAT;
  vertexPosBuffer.numItems = vertices.length / 2 | 0;
  return vertexPosBuffer;
}

let obj;

draw_setup = function(vertex_source, fragment_source) {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  obj = {};

  obj.program = createProgram(vertex_source, fragment_source);
  gl.useProgram(obj.program);

  let vertices = [-1, -1, 1, -1, -1, 1, 1, 1];
  obj.vertexPosBuffer = createQuadBuffer(vertices);
  obj.vertexPosAttrib = gl.getAttribLocation(obj.program, 'aVertexPosition');
  gl.enableVertexAttribArray(obj.vertexPosAttrib);
  gl.vertexAttribPointer(
    obj.vertexPosAttrib,
    obj.vertexPosBuffer.itemSize,
    obj.vertexPosBuffer.itemType,
    false, 0, 0
  );

  obj.canvasSizeUniform = gl.getUniformLocation(obj.program, 'uCanvasSize');
  obj.offsetUniform = gl.getUniformLocation(obj.program, 'uOffset');
  obj.scaleUniform = gl.getUniformLocation(obj.program, 'uScale');
  obj.iterationsUniform = gl.getUniformLocation(obj.program, 'uIterations');
};

var offset = [0, 0], scale = 1.0, iterations = 1000;
draw = function() {
  gl.uniform2f(obj.canvasSizeUniform, width, height);
  gl.uniform2f(obj.offsetUniform, offset[0], offset[1]);
  gl.uniform1f(obj.scaleUniform, scale);
  gl.uniform1i(obj.iterationsUniform, iterations);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, obj.vertexPosBuffer.numItems);
}

let loaded = {};
function fetch(path) {
  return new Promise((resolve, reject) => {
    if (loaded[path]) {
      resolve(loaded[path]);
    }

    let xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.addEventListener("load", function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        loaded[path] = xhr.response;
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    });
    xhr.addEventListener("error", function() {
      reject(xhr.statusText);
    });
    xhr.send();
  });
}

setup = function(vertex_name, fragment_name) {
  return Promise.all([
    fetch("shaders/" + vertex_name),
    fetch("shaders/" + fragment_name),
  ]).then(sources => {
    draw_setup(sources[0], sources[1]);
  }).catch(console.error);
}

setup("default.vert", "mandelbrot-color.frag").then(function() {
  draw();
  
  window.addEventListener("resize", function() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    gl.viewport(0, 0, width, height);
    draw();
  });
  
  document.body.appendChild(canvas);
});

let key_states = {};
let key_mappings = {
  "ArrowLeft": true,
  "ArrowUp": true,
  "ArrowRight": true,
  "ArrowDown": true,
  "z": true,
  "x": true,
}

for (let mapping in key_mappings) {
  key_states[mapping] = false;
}

let is_key_held = false, key_held_id;
function key_held() {
  offset[0] += (key_states.ArrowRight ? scale / 25 : 0) - (key_states.ArrowLeft ? scale / 25 : 0);
  offset[1] += (key_states.ArrowUp ? scale / 25 : 0) - (key_states.ArrowDown ? scale / 25 : 0);
  scale *= (key_states.z ? 0.975 : 1.0) / (key_states.x ? 0.975 : 1.0);
  draw();
}

window.addEventListener("keydown", function(event) {
  var key = event.key;
  if (key_mappings[key]) {
    key_states[key] = true;
    if (!is_key_held) {
      is_key_held = true;
      key_held_id = setInterval(key_held, 16);
    }
  }
});

window.addEventListener("keyup", function(event) {
  var key = event.key;
  if (key_mappings[key]) {
    key_states[key] = false;
    if (is_key_held) {
      for (let key_state in key_states) {
        if (key_states[key_state]) {
          return;
        }
      }
      clearInterval(key_held_id);
      is_key_held = false;
    }
  }
});

var range = document.createElement("input");
range.classList.add("range");
range.type = "range";
range.min = 0;
range.max = 10000;
range.value = 5000;

var range_name_text = document.createElement("div");
range_name_text.classList.add("range_name_text");
range_name_text.textContent = "Iterations";

var range_value_text = document.createElement("div");
range_value_text.classList.add("range_value_text");
range_value_text.textContent = "1000";

range.addEventListener("input", function() {
  var value = Number(range.value) / 10000;
  if (value < 0.5) { // 0 - 1000
    value = value / 0.5 * 1000
  } else { // 1000 - 10000
    value = (value - 0.5) / 0.5 * (10000 - 1000) + 1000;
  }
  iterations = value | 0;
  range_value_text.textContent = iterations;

  draw();
});

var range_container = document.createElement("div");
range_container.classList.add("range_container");

range_container.appendChild(range);
range_container.appendChild(range_name_text);
range_container.appendChild(range_value_text);

document.body.appendChild(range_container);

})();
