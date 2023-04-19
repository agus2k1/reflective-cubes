const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  uniform float uTime;
  uniform sampler2D uMatcap;
  uniform sampler2D uScan;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
    vec3 y = cross(viewDir, x);
    vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;

    vec4 matcapTexture = texture2D(uMatcap, uv);

    vec2 scanUv = fract(vWorldPosition.xz);

    if (vNormal.y < 0.){
      scanUv = vUv * 10.;
    }

    vec4 scanTexture = texture2D(uScan, scanUv);

    // Waves
    vec3 origin = vec3(0.);

    float dist = distance(vWorldPosition, origin);

    float radialMove = fract(dist - uTime);

    // Limit the amount of waves
    // radialMove *= 1. - smoothstep(1., 3., dist);

    // Makes the animation start without waves
    radialMove *= 1. - step(uTime, dist);

    // Wave wide
    float scanMix = smoothstep(0.3, 0., 1. - radialMove);

    // Apply texture to the waves
    scanMix *= 1. + scanTexture.x * 0.7;
    scanMix += smoothstep(0.1, 0., 1. - radialMove) * 1.5;

    // Waves color
    vec3 scanColor = mix(vec3(1.), vec3(0.5, 0.5 ,1.), scanMix * 0.2);
  
    gl_FragColor = vec4( vUv, 0., 1.);
    gl_FragColor = vec4( vWorldPosition, 1.);
    gl_FragColor = matcapTexture;
    gl_FragColor = scanTexture;
    gl_FragColor = vec4(vec3(scanTexture.x), 1.);
    gl_FragColor = vec4(vec3(scanMix), 1.);
    gl_FragColor = vec4(vec3(scanColor), 1.);

    gl_FragColor = matcapTexture;
    // gl_FragColor.rgb = mix(gl_FragColor.rgb, scanColor, scanMix * 0.5);
  }
`;

export default fragmentShader;
