#version 300 es

precision highp float;
uniform sampler2D animationTexture;
uniform float boneCount, animationFrameCount, animationTextureLength, animationCount;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float time;

in vec3 position;
in vec2 inUV;
in vec3 normal;
in vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼
in vec3 mcol0, mcol1, mcol2, mcol3;
in float speed, animationStartTime;
in float animationIndex; // 动画类型
in vec4 textureIndex;
in vec4 bodyScale; // 0:身体 1:头部 2:上肢 3:下肢

out vec2 outUV;
out vec3 outNormal;
out vec4 outTextureIndex;
out vec3 outPosition;
out vec3 myPosition;//化身的位置


float getBoneScale(float bone) { // 身体形变

    if ( bone < 3.5 || (bone > 5.5 && bone < 6.5) || (bone > 15.5 && bone < 16.5) ) // 身体
        return bodyScale[0];
    if ( bone > 3.5 && bone < 5.5 ) // 头部
        return bodyScale[1];
    if ( bone > 6.5 && bone < 15.5 || (bone > 16.5 && bone < 25.5) ) // 上肢
        return bodyScale[2];
    if ( bone > 25.5 ) // 下肢
        return bodyScale[3];
    
}

float computeBodyScale() {

    return (
        skinWeight[0] * getBoneScale(skinIndex[0]) + 
        skinWeight[1] * getBoneScale(skinIndex[1]) +
        skinWeight[2] * getBoneScale(skinIndex[2]) +
        skinWeight[3] * getBoneScale(skinIndex[3])
    );

}

vec3 getAnimationItem(float index) { // 从texture中提取矩阵元素

    float v = floor(index / animationTextureLength);
    float u = index - v * animationTextureLength;
    vec3 data = texture(
        animationTexture, 
        vec2( (0.5 + u) / animationTextureLength, (0.5 + v) / animationTextureLength )
    ).xyz;
    return data;

}

mat4 computeAnimationMatrix(float boneIndex, float frameIndex) { // 计算一个骨骼的变换矩阵

    float startPos = 4. * (boneCount * ((animationIndex - 1.) * animationFrameCount + frameIndex) + boneIndex);
    if ( animationIndex < 0.5 ) {
        startPos = 4. * (boneCount * (2. * animationFrameCount) + boneIndex); // 默认使用三个动画第一帧作为静止状态
    }
    return mat4(
        vec4(getAnimationItem(startPos + 0.), 0.),
        vec4(getAnimationItem(startPos + 1.), 0.),
        vec4(getAnimationItem(startPos + 2.), 0.),
        vec4(getAnimationItem(startPos + 3.), 1.)
    );
    
}

vec3 vertexBlending(vec3 position, float frameIndex) { // 动画形变, 计算4个骨骼的影响

    if ( animationTextureLength < 0.5) return position; // 动画未加载

    vec4 temp = vec4(position, 1.);
    vec4 result = vec4(0., 0., 0., 0.);
    result += skinWeight[0] * computeAnimationMatrix(skinIndex[0], frameIndex) * temp;
    result += skinWeight[1] * computeAnimationMatrix(skinIndex[1], frameIndex) * temp;
    result += skinWeight[2] * computeAnimationMatrix(skinIndex[2], frameIndex) * temp;
    result += skinWeight[3] * computeAnimationMatrix(skinIndex[3], frameIndex) * temp;
    return result.xyz;

}

vec3 frameInterpolation(vec3 position) { // 点坐标插值, 考虑优化:变换矩阵插值

    float m = floor((time - animationStartTime) * speed / animationFrameCount);
    float temp = (time - animationStartTime) * speed - m * animationFrameCount;
    float frameIndex1 = floor(temp);
    float weight = temp - frameIndex1; // 插值权重
    float frameIndex2 = float(int(frameIndex1 + 1.) % int(animationFrameCount));

    // frameIndex1=frameIndex2=0.;//m;

    vec3 p1 = vertexBlending(position, frameIndex1);
    vec3 p2 = vertexBlending(position, frameIndex2);

    return (1. - weight) * p1 + weight * p2;

}
float modFloor(float a, float b){
    return float(int(a)%int(b));
}
void main() {
    float max=13.;//最远移动距离
    float x=0.1*(time - animationStartTime) * speed;
    x=modFloor(x*1000.,max*2.*1000.)/1000.;
    float f=1.;
    if(x>max){
        x=max-(x-max);
        f=-1.;
    }


    outUV = inUV;
    outTextureIndex = textureIndex;


    mat4 transformMatrix = mat4(
        vec4(mcol0.x,mcol0.y,mcol0.z, 0),
        vec4(mcol1.x,mcol1.y,mcol1.z, 0),
        vec4(mcol2.x,mcol2.y,mcol2.z, 0),
        vec4(mcol3, 1.)
    );
    // mat4(
    //     vec4(f, 0., 0., 0.),
    //     vec4(0., f, 0., 0.),
    //     vec4(0., 0., 1., 0.),
    //     vec4(0., 0., 0., 1.)
    // );
    myPosition=vec3(mcol3.x,mcol3.y,mcol3.z);

    
    vec4 position0=vec4(frameInterpolation(position), 1.);
    position0.z=position0.z*f;

    position0.x=position0.x*f;
    // position0.y=position0.y*f;
    vec4 worldPosition = transformMatrix * position0; // 世界坐标下的顶点位置
    vec4 normal = transformMatrix * vec4(frameInterpolation(normal), 0.); // 世界坐标下的顶点向量
    outNormal = normal.xyz;
    outPosition = worldPosition.xyz;

    
    
    // if(animationFrameCount==41.&&animationIndex==1.)
    worldPosition.z=worldPosition.z+x;

    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;

}
