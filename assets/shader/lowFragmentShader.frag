#version 300 es

precision highp float;
uniform sampler2D textureData;
uniform float textureCount;

in vec4 outTextureIndex;
in vec2 outUV;

out vec4 outColor;

vec4 computeTextureColor() {

    float u = outUV.x;
    float v = outUV.y;
    if (u > 0.5) u = 1. - u; // 对称
    u = (u * 2. + outTextureIndex[0]) / textureCount;
    vec4 color = texture( textureData, vec2(u, v) );
    return color;

}

void main() {

    outColor = vec4(computeTextureColor().xyz * 1.1, 1.);

}
