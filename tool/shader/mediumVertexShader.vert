#version 300 es

precision highp float;
uniform sampler2D animationTexture;
uniform float boneCount, animationFrameCount, animationTextureLength, animationCount;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float time;
// uniform vec3 cameraPosition;

in vec3 position;
in vec2 inUV;
in vec3 normal;
in vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼
in vec3 mcol0, mcol1, mcol2, mcol3;
in float speed, animationStartTime;
in float animationIndex; // 动画类型
in vec4 textureIndex;

out vec2 outUV;
out vec3 outNormal;
out vec4 outTextureIndex;
out vec3 outPosition;

vec3 getAnimationItem(float index) { // 从texture中提取矩阵元素

    float v = floor(index / animationTextureLength);
    float u = index - v * animationTextureLength;
    vec3 data = texture(
        animationTexture, 
        vec2( (0.5 + u) / animationTextureLength, (0.5 + v) / animationTextureLength )
    ).xyz;
    return data;

}

mat4 computeAnimationMatrix(float boneIndex) {

    float frameIndex = float(int((time - animationStartTime) * speed) % int(animationFrameCount));
    float startPos = 4. * (boneCount * ((animationIndex - 1.) * animationFrameCount + frameIndex) + boneIndex);
    if ( animationIndex < 0.5 ) {
        startPos = 4. * (boneCount * (2. * animationFrameCount) + boneIndex); // 默认使用三个动画第一帧作为静止状态
    }
    return mat4(
        vec4(getAnimationItem(startPos+0.), 0.),
        vec4(getAnimationItem(startPos+1.), 0.),
        vec4(getAnimationItem(startPos+2.), 0.),
        vec4(getAnimationItem(startPos+3.), 1.)
    );
    
}

void main() {

    outUV = inUV;
    outTextureIndex = textureIndex;

    mat4 animationMatrix = computeAnimationMatrix(skinIndex[0]);
    mat4 transformMatrix = mat4(
        vec4(mcol0, 0.),
        vec4(mcol1, 0.),
        vec4(mcol2, 0.),
        vec4(mcol3, 1.)
    );

    outNormal = (transformMatrix * animationMatrix * vec4(normal, 0.)).xyz;
    vec4 transPos = transformMatrix * animationMatrix * vec4(position, 1.);
    outPosition = transPos.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * transPos;

}
