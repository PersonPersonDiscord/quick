#ifdef GL_FRAGMENT_PRECISION_HIGH
	precision highp float;
#else
	precision mediump float;
#endif

precision mediump int;
uniform vec2 uCanvasSize;

vec4 calc(vec2 texCoord) {
  float x = 0.0;
  float y = 0.0;
  for (int iteration = 0; iteration < 1000; ++iteration) {
    float xtemp = x * x - y * y + texCoord.x;
    y = 2.0 * x * y + texCoord.y;
    x = xtemp;
    if (x * x + y * y >= 8.0) {
      float d = (float(iteration) - (log(log(sqrt(x*x+y*y))) / log(2.0))) / 50.0;
      return vec4(d, d, d, 1);
    }
  }
  return vec4(0, 0, 0, 1);
}

void main() {
  vec2 texCoord = (gl_FragCoord.xy / uCanvasSize.xy) * 2.0 - vec2(1.0, 1.0);
  gl_FragColor = calc(texCoord);
}