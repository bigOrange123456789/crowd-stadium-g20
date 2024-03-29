#version 300 es

precision highp float;
uniform sampler2D textureData;
// uniform sampler2D lightMapData; // lightmap暂时不用
uniform vec2 textureCount; // [row, col]
uniform vec3 cameraPosition;
uniform vec4 headUV;
uniform vec4 handUV;
uniform vec4 bottomUV;

in vec4 outTextureIndex; // 0:身体绝大部分 1:头部与手部 2:裤子 3:未使用
in vec2 outUV;
in vec3 outNormal;
in vec3 outPosition;
in vec3 myPosition;

out vec4 fragColor;

struct PointLight {
    vec3 position;
    vec3 diffuseColor;
    vec3 ambientColor;
};

struct Material {
    vec3 textureColor;
    float kAmbient, kDiffuse, kSpecular; // 环境光, 漫反射, 高光 的比例
    float gloss;
};

float getTextureIndex(float u, float v) { // 身体各部位贴图

    if (
        (u - headUV[0]) * (headUV[2] - u) > 0. &&
        (v - headUV[1]) * (headUV[3] - v) > 0.
    ) { return outTextureIndex[1]; }
    if (
        (u - handUV[0]) * (handUV[2] - u) > 0. &&
        (v - handUV[1]) * (handUV[3] - v) > 0.
    ) { return outTextureIndex[1]; }
    if (
        (u - bottomUV[0]) * (bottomUV[2] - u) > 0. &&
        (v - bottomUV[1]) * (bottomUV[3] - v) > 0.
    ) { return outTextureIndex[2]; }
    else { return outTextureIndex[0]; }

}


vec4 computeTextureColor() { // 贴图颜色
    float u = outUV.x;
    float v = outUV.y;
    if (u > 0.5) u = 1. - u; // 对称
    u = u * 2.;
    float textureIndex = getTextureIndex(u, v);
    
    float col=textureIndex- floor(textureIndex/textureCount[1]) *textureCount[1];//float(int(textureIndex) % int(textureCount[1]));
    col=round(col);
    if(col==textureCount[1])col=0.;

    float row = (textureIndex - col) / textureCount[1];
    // row=round(row);
    
    u = (u * 0.95 + col) / textureCount[1];
    v = (v + row) / textureCount[0];

    vec4 color = texture( textureData, vec2(u, v) );
    return color;
}


// vec4 computeTextureColor_correct() { // 贴图颜色
//     float u = outUV.x;
//     float v = outUV.y;
//     if (u > 0.5) u = 1. - u; // 对称
//     if (u > 0.4985) u = 0.4985; // 去除中缝
//     u = u * 2.;
//     float textureIndex = getTextureIndex(u, v);
    
//     u = (u + textureIndex) / textureCount;

//     vec4 color = texture( textureData, vec2(u, v) );
//     return color;
// }





vec3 blinnPhong( // 光照模型
    PointLight light,
    Material material,
    vec3 surfacePosition,
    vec3 surfaceNormal,
    vec3 viewPosition
) {

    vec3 viewDirection = normalize(viewPosition - surfacePosition);
    vec3 lightDirection = normalize(light.position - surfacePosition);
    vec3 normalDirection = normalize(surfaceNormal);

    // Ambient
    vec3 ambient = light.ambientColor * material.textureColor;

    // Diffuse
    vec3 diffuse = light.diffuseColor * material.textureColor * max(0., dot(lightDirection, normalDirection));

    // vec3 lightmapValue;
    // if (bodyPart != 1){
    //     lightmapValue = texture( lightMapData, outUV ).rgb; // lightMap
    //     ambient *= lightmapValue;
    //     diffuse *= lightmapValue;
    // }

    // Specular  公式: (n·(v+l)/|v+l|)^g
    float specular = pow(max(0., dot(normalize(viewDirection + lightDirection), normalDirection)), material.gloss);//高光颜色是白色？

    return (
        material.kAmbient * ambient +   //vec3
        material.kDiffuse * diffuse +   //vec3
        material.kSpecular * specular   //float
    );

}

void main() {
    PointLight light = PointLight(
        //vec3(0., 40., 0.),
        vec3(myPosition.x+18., myPosition.y+140., myPosition.z), // 点光源位置
        vec3(1., 1., 1.), // 漫反射颜色
        vec3(1.1, 1.1, 1.1) // 高光颜色
    );

    Material material = Material(
        computeTextureColor().rgb,
        0.7, 0.4, 0.25, // 三种光照比例 环境光:漫反射:高光
        16. // 粗糙度  其值越大, 高光区域越小
    );
    

    fragColor = vec4(blinnPhong(light, material, outPosition, outNormal, cameraPosition), 1.);

}
