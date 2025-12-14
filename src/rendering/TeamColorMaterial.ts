import * as THREE from 'three';

export class TeamColorMaterial extends THREE.ShaderMaterial {
  constructor(texture: THREE.Texture, teamColor: THREE.Color) {
    super({
      uniforms: {
        map: { value: texture },
        uTeamColor: { value: teamColor }, // The target team color
        uKeyColor: { value: new THREE.Color(0x00FF00) }, // The green to replace
        uTolerance: { value: 0.45 } // How close to green to trigger replacement
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 uTeamColor;
        uniform vec3 uKeyColor;
        uniform float uTolerance;
        varying vec2 vUv;

        void main() {
          vec4 texColor = texture2D(map, vUv);
          
          // Calculate distance from key color
          float dist = distance(texColor.rgb, uKeyColor);
          
          if (dist < uTolerance) {
             // Replace with team color, preserving alpha and some shading
             // Simple replacement:
             // gl_FragColor = vec4(uTeamColor, texColor.a);
             
             // Better replacement preserving brightness:
             float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
             // Since key color is bright green (0,1,0), brightness is ~0.587.
             // We can just modulate the team color by the texture brightness relative to key brightness?
             // Or just simple multiply:
             // gl_FragColor = vec4(uTeamColor * (texColor.rgb / uKeyColor), texColor.a); -> dangerous if key is 0
             
             // Simplest "Tint" approach for 2D pixel art often just swaps the hue.
             // Let's just use the uTeamColor but multiply by the texture's lightness?
             
             // Simple swap:
             gl_FragColor = vec4(uTeamColor, texColor.a);
             
             // To keep some detail (shadows on the green), we can check if it's "dark green" vs "light green".
             // But for now, simple swap is safest for pixel art.
          } else {
             gl_FragColor = texColor;
          }
        }
      `,
      transparent: true
    });
  }
}
