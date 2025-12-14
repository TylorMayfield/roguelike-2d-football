import * as THREE from 'three';

export interface UniversalMaterialOptions {
    texture: THREE.Texture;
    uJerseyColor: THREE.Color; // Replaces Green
    uSkinColor: THREE.Color;   // Replaces original skin tone
    uPantsColor: THREE.Color;  // Replaces original pants tone
}

export class UniversalPlayerMaterial extends THREE.ShaderMaterial {
  constructor(options: UniversalMaterialOptions) {
    super({
      uniforms: {
        map: { value: options.texture },
        uJerseyColor: { value: options.uJerseyColor },
        uSkinColor: { value: options.uSkinColor },
        uPantsColor: { value: options.uPantsColor },
        
        // Key Colors (The colors found in the base sprite)
        // Green Jersey
        kJersey: { value: new THREE.Color(0x00FF00) }, 
        // Skin = Magenta
        kSkin: { value: new THREE.Color(0xFF00FF) }, 
        // Pants = Blue
        kPants: { value: new THREE.Color(0x0000FF) },
        
        // UV Transforms for Animation
        uOffset: { value: new THREE.Vector2(0, 0) },
        uRepeat: { value: new THREE.Vector2(1, 1) }
      },
      vertexShader: `
        uniform vec2 uOffset;
        uniform vec2 uRepeat;
        varying vec2 vUv;
        void main() {
          vUv = uv * uRepeat + uOffset;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 uJerseyColor;
        uniform vec3 uSkinColor;
        uniform vec3 uPantsColor;
        
        uniform vec3 kJersey;
        uniform vec3 kSkin;
        uniform vec3 kPants;

        varying vec2 vUv;

        // Simple distance check
        bool isClose(vec3 c1, vec3 c2, float tol) {
            return distance(c1, c2) < tol;
        }

        void main() {
          vec4 texColor = texture2D(map, vUv);
          if (texColor.a < 0.1) discard;

          vec3 finalColor = texColor.rgb;
          
          // Color Replacement Logic
          // We use relatively loose tolerances because pixel art might have anti-aliasing or slight variations
          
          // 1. Jersey (Green)
          if (isClose(texColor.rgb, kJersey, 0.45)) {
              // Preserve some shading? 
              // Simple tint: multiply by brightness relative to key?
              // For now, simple replace or mix.
              // Let's mix "Shadow" (darker green) properly?
              // Simple replacement usually looks flat. 
              // Let's try to preserve luminance.
              
              float keyLum = dot(kJersey, vec3(0.299, 0.587, 0.114));
              float texLum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
              float lumRatio = texLum / max(0.01, keyLum);
              
              finalColor = uJerseyColor * lumRatio;
          }
          // 2. Skin
          else if (isClose(texColor.rgb, kSkin, 0.3)) {
               // Assuming kSkin is the 'mid-tone'
               finalColor = uSkinColor; // Simple swap for skin usually ok
          }
          // 3. Pants (Grey/White)
          // Harder to separate from white helmet stripes but let's try
          else if (isClose(texColor.rgb, kPants, 0.3)) {
               finalColor = uPantsColor;
          }

          gl_FragColor = vec4(finalColor, texColor.a);
        }
      `,
      transparent: true
    });
  }
}
