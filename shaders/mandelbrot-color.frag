#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

precision mediump int;

uniform vec2 uCanvasSize;
uniform vec2 uOffset;
uniform float uScale;
uniform int uIterations;

const int MAX_ITERATIONS = 10000;

vec4 calc(vec2 texCoord) {
  float x = 0.0;
  float y = 0.0;
  float v = 10000.0;
  float j = 10000.0;
  for (int iteration = 0; iteration < MAX_ITERATIONS; ++iteration) {
    if (iteration >= uIterations) {
      break;
    }
    float xtemp = x * x - y * y + texCoord.x;
    y = 2.0 * x * y + texCoord.y;
    x = xtemp;
    v = min(v, abs(x * x + y * y));
    j = min(j, abs(x * y));

    if (x * x + y * y >= 8.0) {
      float d = (float(iteration) - (log(log(sqrt(x*x+y*y))) / log(2.0))) / 50.0;
      v = (1.0 - v) / 2.0;
      j = (1.0 - j) / 2.0;
      return vec4(d + j, d, d + v, 1);
    }
  }
  return vec4(0, 0, 0, 1);
}

void main() {
  vec2 texCoord = (gl_FragCoord.xy / uCanvasSize.xy) * 2.0 - vec2(1.0, 1.0);
  texCoord = texCoord * uScale + uOffset;
  gl_FragColor = calc(texCoord);
}