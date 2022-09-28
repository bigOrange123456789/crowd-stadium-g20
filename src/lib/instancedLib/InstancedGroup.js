import * as THREE from "three";
class InstancedGroup {

    constructor(
        instanceCount,
        originMesh,
        animationUrl,
        morphTargetUrl,
        textureData,// textureUrl,
        lightMapUrl,
        textureCount, // [row, col]
        camera,
        clock,
    ) {

        // this.mesh;
        this.instanceCount = instanceCount;
        this.originMesh = originMesh;
        this.animationUrl = animationUrl;
        this.morphTargetUrl = morphTargetUrl;
        this.textureData=textureData;//this.textureUrl = textureUrl;
        this.textureCount = textureCount;
        this.lightMapUrl = lightMapUrl;
        this.camera = camera;
        this.uniforms;

        this.clock = clock;
        this.ifAnimated = !!animationUrl;
        this.ifMorphTarget = !!morphTargetUrl;
        this.dummy = new THREE.Object3D();

        // matrix
        this.mcol0;
        this.mcol1;
        this.mcol2;
        this.mcol3;

        this.speed; // 动画速度
        this.morphTargetWeight; // morph target 权重
        this.animationStartTime;
        this.animationType; // 动画类型
        this.textureType; // 身体贴图类型 vec4
        this.bodyScale; // 身体各部位缩放比例

        // body 每个身体部位对应的贴图uv坐标位置
        this.body = {
            head: [],
            hand: [],
            bottom: []
        }

    }

    async init() {
        var time0=performance.now()
        var test_print=[]

        this.originMesh.geometry = this.originMesh.geometry.toNonIndexed();

        this.mcol0 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol1 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol2 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.mcol3 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
        this.textureType = new THREE.InstancedBufferAttribute(new Uint8Array(this.instanceCount * 4), 4);
        this.animationType = new THREE.InstancedBufferAttribute(new Uint8Array(this.instanceCount), 1);
        if (this.ifAnimated) {
            if (this.ifMorphTarget) this.morphTargetWeight = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);
            this.speed = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);
            this.animationStartTime = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount), 1);
            this.bodyScale = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 4), 4);
        }

        for (let i = 0; i < this.instanceCount; i++) {
            this.reset(i);
        }

        var time1=performance.now()
        test_print.push([time1-time0,"-1-"])

        const material = await this.initMaterial();
        
        var time2=performance.now()
        test_print.push([time2-time1,"-2-:await this.initMaterial"])

        const geometry = await this.initGeometry();

        var time3=performance.now()
        test_print.push([time3-time2,"-3-:await this.initGeometry"])


        const mesh = new THREE.InstancedMesh(geometry, material, this.instanceCount);
        mesh.castShadow = true; // 阴影
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        this.mesh = mesh;

        var time4=performance.now()
        test_print.push([time4-time3,"-4-:end"])
        test_print.push([time4-time0,"all"])
        console.log("InstancedGroup.init",test_print)

        return mesh;

    }

    async initMaterial() {
        var time0=performance.now()
        var test_print=[]

        // const textureData = await this.loadTexture(this.textureUrl);
        // textureData.flipY = false;

        const vertexShader = await this.loadShader(this.vertURL);

        var time1=performance.now()
        test_print.push([time1-time0,"-1-:await load(vertURL)"])

        const fragmentShader = await this.loadShader(this.fragURL);

        var time2=performance.now()
        test_print.push([time2-time1,"-2-:await load(fragURL)",this.fragURL])

        let material = new THREE.RawShaderMaterial();
        material.vertexShader = vertexShader;
        material.fragmentShader = fragmentShader;

        this.uniforms = {
            textureCount: { value: new THREE.Vector2(...this.textureCount) },
            textureData: { value: this.textureData },
            headUV: { value: new THREE.Vector4(...this.body.head) },
            handUV: { value: new THREE.Vector4(...this.body.hand) },
            bottomUV: { value: new THREE.Vector4(...this.body.bottom) }
        };
        if (this.ifAnimated) {
            this.uniforms.time = { value: 0 };
            this.uniforms.boneCount = { value: 0 };
            this.uniforms.animationCount = { value: 0 };
            this.uniforms.animationFrameCount = { value: 0 };
            this.uniforms.animationTexture = { value: new THREE.DataTexture(new Float32Array([0,0,0]), 1, 1, THREE.RGBFormat, THREE.FloatType) };
            this.uniforms.animationTextureLength = { value: 0 };
            this.initAnimation(this.uniforms); // 异步加载动画数据
        }
        var time3=performance.now()
        test_print.push([time3-time2,"-3-:if Animated"])

        if (this.lightMapUrl) {
            const lightMapData = await this.loadTexture(this.lightMapUrl);
            this.uniforms.lightMapData = { value: lightMapData };
        }

        var time4=performance.now()
        test_print.push([time4-time3,"-4-:if lightMapUrl"])

        material.uniforms = this.uniforms;
        // this.updateTexture()

        var time5=performance.now()
        test_print.push([time5-time4,"-5-"])
        test_print.push([time5-time0,"-all-"])
        console.log("InstancedGroup.initMaterial",test_print)

        return material;

    }
    async updateTexture(url,cb) {
        // var textureData;
        // if(this.textureUrl=="assets/crowd/texture/maleTextureLow.webp")textureData = await this.loadTexture("assets/crowd/texture/maleTextureHigh.webp");
        // else textureData = await this.loadTexture("assets/crowd/texture/femaleTextureHigh.webp");
        var textureData =await this.loadTexture(url);
        textureData.flipY = false;
        this.uniforms.textureData={ value: textureData };
        if(cb){
            cb(textureData)
        }
    }


    async initAnimation(uniforms) {

        const animations = await this.loadJSON(this.animationUrl);
        const boneCount = this.originMesh.skeleton.bones.length;
        const animationData = animations.animation.flat();
        const animationDataLength = animations.config.reduce((prev, cur) => prev + cur, 0); // sum
        const animationTextureLength = THREE.MathUtils.ceilPowerOfTwo( Math.sqrt(animationDataLength / 3) );

        uniforms.animationTexture.value.dispose();
        uniforms.time = { value: 0 };
        uniforms.boneCount = { value: boneCount };
        uniforms.animationCount = { value: animations.config.length };
        uniforms.animationFrameCount = { value: animations.config[0] / boneCount / 12 };
        uniforms.animationTexture = { value: this.array2Texture(animationData, animationTextureLength) }; // 将动画数据保存为图片Texture格式
        uniforms.animationTextureLength = { value: animationTextureLength };
        
        let scope = this;
        
        updateAnimation();

        function updateAnimation() {
            let time = scope.clock.getElapsedTime();
            uniforms.time = { value: time };
            uniforms.cameraPosition = { value: scope.camera.position };
            requestAnimationFrame(updateAnimation);
        }

    }

    async initGeometry() {

        let geometry = new THREE.InstancedBufferGeometry();
        geometry.instanceCount = this.instanceCount;
        geometry.setAttribute('position', this.originMesh.geometry.attributes.position);
        geometry.setAttribute('inUV', this.originMesh.geometry.attributes.uv);
        geometry.setAttribute('normal', this.originMesh.geometry.attributes.normal);
        geometry.setAttribute('animationIndex', this.animationType);
        if (this.ifAnimated) {
            if (this.ifMorphTarget) {
                const morphTargetData = await this.loadJSON(this.morphTargetUrl);
                geometry.setAttribute('morphTarget', new THREE.BufferAttribute(new Float32Array(morphTargetData), 3, false));
                geometry.setAttribute('morphTargetWeight', this.morphTargetWeight);
            }
            geometry.setAttribute('skinIndex', this.originMesh.geometry.attributes.skinIndex);
            geometry.setAttribute('skinWeight', this.originMesh.geometry.attributes.skinWeight);
            geometry.setAttribute('speed', this.speed);
            geometry.setAttribute('animationStartTime', this.animationStartTime);
            geometry.setAttribute('bodyScale', this.bodyScale);
        }

        geometry.setAttribute('mcol0', this.mcol0);
        geometry.setAttribute('mcol1', this.mcol1);
        geometry.setAttribute('mcol2', this.mcol2);
        geometry.setAttribute('mcol3', this.mcol3);

        geometry.setAttribute('textureIndex', this.textureType);

        return geometry;

    }

    loadJSON( path ) {

        return new Promise( (resolve, reject) => { 
            const animationLoader = new THREE.FileLoader();
            animationLoader.load( path, data => {
                const animationData = JSON.parse( data );
                resolve( animationData );
            } );
        } );

    }

    loadTexture(path) {

        return new Promise((resolve, reject)=> {
            new THREE.TextureLoader().load(
                path,
                texture => { // onLoad
                    texture.flipY = false;
                    resolve(texture);
                }, 
                null, // onProgress
                error => reject(error) // onError
            )
        });
        
    }

    loadShader(path) {

        return new Promise((resolve, reject) => {
            if(!window.my_shader)window.my_shader={
    "assets/shader/highFragmentShader.frag": "#version 300 es\n\nprecision highp float;\nuniform sampler2D textureData;\n// uniform sampler2D lightMapData; // lightmap暂时不用\nuniform vec2 textureCount; // [row, col]\nuniform vec3 cameraPosition;\nuniform vec4 headUV;\nuniform vec4 handUV;\nuniform vec4 bottomUV;\n\nin vec4 outTextureIndex; // 0:身体绝大部分 1:头部与手部 2:裤子 3:未使用\nin vec2 outUV;\nin vec3 outNormal;\nin vec3 outPosition;\nin vec3 myPosition;\n\nout vec4 fragColor;\n\nstruct PointLight {\n    vec3 position;\n    vec3 diffuseColor;\n    vec3 ambientColor;\n};\n\nstruct Material {\n    vec3 textureColor;\n    float kAmbient, kDiffuse, kSpecular; // 环境光, 漫反射, 高光 的比例\n    float gloss;\n};\n\nfloat getTextureIndex(float u, float v) { // 身体各部位贴图\n\n    if (\n        (u - headUV[0]) * (headUV[2] - u) > 0. &&\n        (v - headUV[1]) * (headUV[3] - v) > 0.\n    ) { return outTextureIndex[1]; }\n    if (\n        (u - handUV[0]) * (handUV[2] - u) > 0. &&\n        (v - handUV[1]) * (handUV[3] - v) > 0.\n    ) { return outTextureIndex[1]; }\n    if (\n        (u - bottomUV[0]) * (bottomUV[2] - u) > 0. &&\n        (v - bottomUV[1]) * (bottomUV[3] - v) > 0.\n    ) { return outTextureIndex[2]; }\n    else { return outTextureIndex[0]; }\n\n}\n\n\nvec4 computeTextureColor() { // 贴图颜色\n    float u = outUV.x;\n    float v = outUV.y;\n    if (u > 0.5) u = 1. - u; // 对称\n    u = u * 2.;\n    float textureIndex = getTextureIndex(u, v);\n    \n    float col=textureIndex- floor(textureIndex/textureCount[1]) *textureCount[1];//float(int(textureIndex) % int(textureCount[1]));\n    col=round(col);\n    if(col==textureCount[1])col=0.;\n\n    float row = (textureIndex - col) / textureCount[1];\n    // row=round(row);\n    \n    u = (u * 0.95 + col) / textureCount[1];\n    v = (v + row) / textureCount[0];\n\n    vec4 color = texture( textureData, vec2(u, v) );\n    return color;\n}\n\n\n// vec4 computeTextureColor_correct() { // 贴图颜色\n//     float u = outUV.x;\n//     float v = outUV.y;\n//     if (u > 0.5) u = 1. - u; // 对称\n//     if (u > 0.4985) u = 0.4985; // 去除中缝\n//     u = u * 2.;\n//     float textureIndex = getTextureIndex(u, v);\n    \n//     u = (u + textureIndex) / textureCount;\n\n//     vec4 color = texture( textureData, vec2(u, v) );\n//     return color;\n// }\n\n\n\n\n\nvec3 blinnPhong( // 光照模型\n    PointLight light,\n    Material material,\n    vec3 surfacePosition,\n    vec3 surfaceNormal,\n    vec3 viewPosition\n) {\n\n    vec3 viewDirection = normalize(viewPosition - surfacePosition);\n    vec3 lightDirection = normalize(light.position - surfacePosition);\n    vec3 normalDirection = normalize(surfaceNormal);\n\n    // Ambient\n    vec3 ambient = light.ambientColor * material.textureColor;\n\n    // Diffuse\n    vec3 diffuse = light.diffuseColor * material.textureColor * max(0., dot(lightDirection, normalDirection));\n\n    // vec3 lightmapValue;\n    // if (bodyPart != 1){\n    //     lightmapValue = texture( lightMapData, outUV ).rgb; // lightMap\n    //     ambient *= lightmapValue;\n    //     diffuse *= lightmapValue;\n    // }\n\n    // Specular  公式: (n·(v+l)/|v+l|)^g\n    float specular = pow(max(0., dot(normalize(viewDirection + lightDirection), normalDirection)), material.gloss);\n\n    return (\n        material.kAmbient * ambient +\n        material.kDiffuse * diffuse +\n        material.kSpecular * specular\n    );\n\n}\n\nvoid main() {\n    PointLight light = PointLight(\n        //vec3(0., 40., 0.),\n        vec3(myPosition.x+18., myPosition.y+140., myPosition.z), // 点光源位置\n        vec3(1., 1., 1.), // 漫反射颜色\n        vec3(1.1, 1.1, 1.1) // 高光颜色\n    );\n\n    Material material = Material(\n        computeTextureColor().rgb,\n        0.7, 0.4, 0.25, // 三种光照比例 环境光:漫反射:高光\n        16. // 粗糙度  其值越大, 高光区域越小\n    );\n    \n\n    fragColor = vec4(blinnPhong(light, material, outPosition, outNormal, cameraPosition), 1.);\n\n}\n",
	"assets/shader/highVertexShader.vert": "#version 300 es\n\nprecision highp float;\nuniform sampler2D animationTexture;\nuniform float boneCount, animationFrameCount, animationTextureLength, animationCount;\nuniform mat4 modelViewMatrix, projectionMatrix;\nuniform float time;\n\nin vec3 position;\nin vec2 inUV;\nin vec3 normal;\nin vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼\nin vec3 mcol0, mcol1, mcol2, mcol3;\nin float speed, animationStartTime;\nin float animationIndex; // 动画类型\nin vec4 textureIndex;\nin vec4 bodyScale; // 0:身体 1:头部 2:上肢 3:下肢\n\nout vec2 outUV;\nout vec3 outNormal;\nout vec4 outTextureIndex;\nout vec3 outPosition;\nout vec3 myPosition;//化身的位置\n\nfloat getBoneScale(float bone) { // 身体形变\n\n    if ( bone < 3.5 || (bone > 5.5 && bone < 6.5) || (bone > 15.5 && bone < 16.5) ) // 身体\n        return bodyScale[0];\n    if ( bone > 3.5 && bone < 5.5 ) // 头部\n        return bodyScale[1];\n    if ( bone > 6.5 && bone < 15.5 || (bone > 16.5 && bone < 25.5) ) // 上肢\n        return bodyScale[2];\n    if ( bone > 25.5 ) // 下肢\n        return bodyScale[3];\n    \n}\n\nfloat computeBodyScale() {\n\n    return (\n        skinWeight[0] * getBoneScale(skinIndex[0]) + \n        skinWeight[1] * getBoneScale(skinIndex[1]) +\n        skinWeight[2] * getBoneScale(skinIndex[2]) +\n        skinWeight[3] * getBoneScale(skinIndex[3])\n    );\n\n}\n\nvec3 getAnimationItem(float index) { // 从texture中提取矩阵元素\n\n    float v = floor(index / animationTextureLength);\n    float u = index - v * animationTextureLength;\n    vec3 data = texture(\n        animationTexture, \n        vec2( (0.5 + u) / animationTextureLength, (0.5 + v) / animationTextureLength )\n    ).xyz;\n    return data;\n\n}\n\nmat4 computeAnimationMatrix(float boneIndex, float frameIndex) { // 计算一个骨骼的变换矩阵\n\n    float startPos = 4. * (boneCount * ((animationIndex - 1.) * animationFrameCount + frameIndex) + boneIndex);\n    if ( animationIndex < 0.5 ) {\n        startPos = 4. * (boneCount * (2. * animationFrameCount) + boneIndex); // 默认使用三个动画第一帧作为静止状态\n    }\n    return mat4(\n        vec4(getAnimationItem(startPos + 0.), 0.),\n        vec4(getAnimationItem(startPos + 1.), 0.),\n        vec4(getAnimationItem(startPos + 2.), 0.),\n        vec4(getAnimationItem(startPos + 3.), 1.)\n    );\n    \n}\n\nvec3 vertexBlending(vec3 position, float frameIndex) { // 动画形变, 计算4个骨骼的影响\n\n    if ( animationTextureLength < 0.5) return position; // 动画未加载\n\n    vec4 temp = vec4(position, 1.);\n    vec4 result = vec4(0., 0., 0., 0.);\n    result += skinWeight[0] * computeAnimationMatrix(skinIndex[0], frameIndex) * temp;\n    result += skinWeight[1] * computeAnimationMatrix(skinIndex[1], frameIndex) * temp;\n    result += skinWeight[2] * computeAnimationMatrix(skinIndex[2], frameIndex) * temp;\n    result += skinWeight[3] * computeAnimationMatrix(skinIndex[3], frameIndex) * temp;\n    return result.xyz;\n\n}\n\nvec3 frameInterpolation(vec3 position) { // 点坐标插值, 考虑优化:变换矩阵插值\n\n    float m = floor((time - animationStartTime) * speed / animationFrameCount);\n    float temp = (time - animationStartTime) * speed - m * animationFrameCount;\n    float frameIndex1 = floor(temp);\n    float weight = temp - frameIndex1; // 插值权重\n    float frameIndex2 = float(int(frameIndex1 + 1.) % int(animationFrameCount));\n\n    vec3 p1 = vertexBlending(position, frameIndex1);\n    vec3 p2 = vertexBlending(position, frameIndex2);\n\n    return (1. - weight) * p1 + weight * p2;\n\n}\n\nvoid main() {\n    myPosition=vec3(mcol3.x,mcol3.y,mcol3.z);\n\n    outUV = inUV;\n    outTextureIndex = textureIndex;\n\n    mat4 transformMatrix = mat4(\n        vec4(mcol0, 0.),\n        vec4(mcol1, 0.),\n        vec4(mcol2, 0.),\n        vec4(mcol3, 1.)\n    );\n    \n    // float scale = computeBodyScale(); // 身体形变,暂不使用\n    vec4 worldPosition = transformMatrix * vec4(frameInterpolation(position), 1.); // 世界坐标下的顶点位置\n    vec4 normal = transformMatrix * vec4(frameInterpolation(normal), 0.); // 世界坐标下的顶点向量\n    outNormal = normal.xyz;\n    outPosition = worldPosition.xyz;\n\n    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;\n\n}\n",
	"assets/shader/lowFragmentShader.frag": "#version 300 es\nprecision highp float;\nuniform sampler2D textureData;\nuniform vec2 textureCount; // [row, col]\nin vec4 outTextureIndex;\nin vec2 outUV;\nout vec4 outColor;\nvec4 computeTextureColor() { // 贴图颜色\n    float u = outUV.x;\n    float v = outUV.y;\n    if (u > 0.5) u = 1. - u; // 对称\n    u = u * 2.;\n    float textureIndex = outTextureIndex[0];\n    float col=textureIndex- floor(textureIndex/textureCount[1]) *textureCount[1];//float(int(textureIndex) % int(textureCount[1]));\n    col=round(col);\n    if(col==textureCount[1])col=0.;\n    float row = (textureIndex - col) / textureCount[1];\n    // row=round(row);\n    u = (u * 0.95 + col) / textureCount[1];\n    v = (v + row) / textureCount[0];\n    vec4 color = texture( textureData, vec2(u, v) );\n    return color;\n}\nvoid main() {\n    outColor = vec4(computeTextureColor().xyz * 1.1, 1.);\n}\n",
	"assets/shader/lowVertexShader.vert": "#version 300 es\n\nprecision highp float;\nuniform mat4 modelViewMatrix, projectionMatrix;\n// uniform vec3 cameraPosition;\n\nin vec3 position;\nin vec2 inUV;\nin vec3 normal;\nin vec3 mcol0, mcol1, mcol2, mcol3;\nin vec4 textureIndex;\nin float animationIndex; // 动画类型\n\nout vec2 outUV;\nout vec3 outNormal;\nout vec4 outTextureIndex;\n// out vec3 lightDirection;\n\nvoid main() {\n\n    outUV = inUV;\n    outNormal = normal;\n    outTextureIndex = textureIndex;\n\n    // lightDirection = normalize(cameraPosition - mcol3);\n\n    mat4 transformMatrix = mat4(\n        vec4(mcol0, 0),\n        vec4(mcol1, 0),\n        vec4(mcol2, 0),\n        vec4(mcol3, 1)\n    );\n    \n\n    vec3 pos = position;\n    if (animationIndex > 5.5) { // 如果是站立动画, 位置向上移动\n        pos.z += 0.3;\n    }\n    gl_Position = projectionMatrix * modelViewMatrix * transformMatrix * vec4(pos, 1.0);\n    // gl_Position = projectionMatrix * modelViewMatrix *  vec4(\n    //     pos.x*mcol0[0]+mcol3[0], \n    //     pos.y*mcol1[1]+mcol3[1], \n    //     pos.z*mcol2[2]+mcol3[2], \n    //     1.0);\n    // gl_Position = projectionMatrix * modelViewMatrix *  vec4(\n    //     pos.x+mcol3[0], \n    //     pos.y+mcol3[1], \n    //     pos.z+mcol3[2], \n    //     1.0);\n\n\n}\n",
	"assets/shader/mediumFragmentShader.frag": "#version 300 es\n\nprecision highp float;\nuniform sampler2D textureData;\n// uniform sampler2D lightMapData;\nuniform vec2 textureCount; // [row, col]\nuniform vec3 cameraPosition;\nuniform vec4 headUV;\nuniform vec4 handUV;\nuniform vec4 bottomUV;\n\nin vec4 outTextureIndex;\nin vec2 outUV;\nin vec3 outNormal;\nin vec3 outPosition;\n\nout vec4 fragColor;\n\nstruct PointLight {\n    vec3 position;\n    vec3 diffuseColor;\n    vec3 ambientColor;\n};\n\nstruct Material {\n    vec3 textureColor;\n    float kAmbient, kDiffuse, kSpecular; // 环境光, 漫反射, 高光 的比例\n    float gloss;\n};\n\nfloat getTextureIndex(float u, float v) {\n\n    if (\n        (u - headUV[0]) * (headUV[2] - u) > 0. &&\n        (v - headUV[1]) * (headUV[3] - v) > 0.\n    ) { return outTextureIndex[1]; }\n    if (\n        (u - handUV[0]) * (handUV[2] - u) > 0. &&\n        (v - handUV[1]) * (handUV[3] - v) > 0.\n    ) { return outTextureIndex[1]; }\n    if (\n        (u - bottomUV[0]) * (bottomUV[2] - u) > 0. &&\n        (v - bottomUV[1]) * (bottomUV[3] - v) > 0.\n    ) { return outTextureIndex[2]; }\n    else { return outTextureIndex[0]; }\n\n}\n\nvec4 computeTextureColor() { // 贴图颜色\n\n    float u = outUV.x;\n    float v = outUV.y;\n    if (u > 0.5) u = 1. - u; // 对称\n    u = u * 2.;\n    float textureIndex = getTextureIndex(u, v);\n\n    float col=textureIndex- floor(textureIndex/textureCount[1]) *textureCount[1];//float(int(textureIndex) % int(textureCount[1]));\n    col=round(col);\n    if(col==textureCount[1])col=0.;\n    float row = (textureIndex - col) / textureCount[1];\n    // row=round(row);\n\n    u = (u * 0.95 + col) / textureCount[1];\n    v = (v + row) / textureCount[0];\n    vec4 color = texture( textureData, vec2(u, v) );\n    return color;\n\n}\n\nvec3 blinnPhong( // 光照模型\n    PointLight light,\n    Material material,\n    vec3 surfacePosition,\n    vec3 surfaceNormal,\n    vec3 viewPosition\n) {\n\n    vec3 viewDirection = normalize(viewPosition - surfacePosition);\n    vec3 lightDirection = normalize(light.position - surfacePosition);\n    vec3 normalDirection = normalize(surfaceNormal);\n\n    // Ambient\n    vec3 ambient = light.ambientColor * material.textureColor;\n\n    // Diffuse\n    vec3 diffuse = light.diffuseColor * material.textureColor * max(0., dot(lightDirection, normalDirection));\n\n    // vec3 lightmapValue = texture( lightMapData, outUV ).rgb; // lightMap\n    // ambient *= lightmapValue;\n    // diffuse *= lightmapValue;\n\n    // Specular  公式: (n·(v+l)/|v+l|)^g\n    float specular = pow(max(0., dot(normalize(viewDirection + lightDirection), normalDirection)), material.gloss);\n\n    return (\n        material.kAmbient * ambient +\n        material.kDiffuse * diffuse +\n        material.kSpecular * specular\n    );\n\n}\n\nvoid main() {\n\n    PointLight light = PointLight(\n        vec3(0., 40.97, 0.), // 点光源位置\n        vec3(1., 1., 1.), // 漫反射颜色\n        vec3(1., 1., 1.) // 高光颜色\n    );\n\n    Material material = Material(\n        computeTextureColor().rgb,\n        0.7, 0.4, 0.25, // 三种光照比例 环境光:漫反射:高光\n        16. // 粗糙度  其值越大, 高光区域越小\n    );\n    \n\n    fragColor = vec4(blinnPhong(light, material, outPosition, outNormal, cameraPosition), 1.);\n\n}\n",
	"assets/shader/mediumVertexShader.vert": "#version 300 es\n\nprecision highp float;\nuniform sampler2D animationTexture;\nuniform float boneCount, animationFrameCount, animationTextureLength, animationCount;\nuniform mat4 modelViewMatrix, projectionMatrix;\nuniform float time;\n// uniform vec3 cameraPosition;\n\nin vec3 position;\nin vec2 inUV;\nin vec3 normal;\nin vec4 skinIndex, skinWeight; // 仅使用了绑定的第一个骨骼\nin vec3 mcol0, mcol1, mcol2, mcol3;\nin float speed, animationStartTime;\nin float animationIndex; // 动画类型\nin vec4 textureIndex;\n\nout vec2 outUV;\nout vec3 outNormal;\nout vec4 outTextureIndex;\nout vec3 outPosition;\n\nvec3 getAnimationItem(float index) { // 从texture中提取矩阵元素\n\n    float v = floor(index / animationTextureLength);\n    float u = index - v * animationTextureLength;\n    vec3 data = texture(\n        animationTexture, \n        vec2( (0.5 + u) / animationTextureLength, (0.5 + v) / animationTextureLength )\n    ).xyz;\n    return data;\n\n}\n\nmat4 computeAnimationMatrix(float boneIndex) {\n\n    float frameIndex = float(int((time - animationStartTime) * speed) % int(animationFrameCount));\n    float startPos = 4. * (boneCount * ((animationIndex - 1.) * animationFrameCount + frameIndex) + boneIndex);\n    if ( animationIndex < 0.5 ) {\n        startPos = 4. * (boneCount * (2. * animationFrameCount) + boneIndex); // 默认使用三个动画第一帧作为静止状态\n    }\n    return mat4(\n        vec4(getAnimationItem(startPos+0.), 0.),\n        vec4(getAnimationItem(startPos+1.), 0.),\n        vec4(getAnimationItem(startPos+2.), 0.),\n        vec4(getAnimationItem(startPos+3.), 1.)\n    );\n    \n}\n\nvoid main() {\n\n    outUV = inUV;\n    outTextureIndex = textureIndex;\n\n    mat4 animationMatrix = computeAnimationMatrix(skinIndex[0]);\n    mat4 transformMatrix = mat4(\n        vec4(mcol0, 0.),\n        vec4(mcol1, 0.),\n        vec4(mcol2, 0.),\n        vec4(mcol3, 1.)\n    );\n\n    outNormal = (transformMatrix * animationMatrix * vec4(normal, 0.)).xyz;\n    vec4 transPos = transformMatrix * animationMatrix * vec4(position, 1.);\n    outPosition = transPos.xyz;\n\n    gl_Position = projectionMatrix * modelViewMatrix * transPos;\n\n}\n"
            }
            if(window.my_shader[path]){
                resolve(window.my_shader[path])
                return
            }

            let xhr = new XMLHttpRequest();
            xhr.onload =  () => {
                resolve(xhr.responseText)
                window.my_shader[path]=xhr.responseText
            };
            xhr.onerror =  event => reject(event);
            xhr.open('GET', path);
            xhr.overrideMimeType("text/html;charset=utf-8");
            xhr.send();
        });

    }

    array2Texture(array, length) {

        let data = new Float32Array(length * length * 4); // RGB:3 RGBA:4
        let _array = [];
        array.forEach((value, index) => {
            _array.push(value);
            if ((index + 1) % 3 == 0) _array.push(0);
        });
        data.set(_array);
        let texture = new THREE.DataTexture(data, length, length, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;
        return texture;

    }

    getMatrix(avatarIndex) {

        let matrix = new THREE.Matrix4();
        matrix.set(
            this.mcol0.array[3 * avatarIndex], this.mcol1.array[3 * avatarIndex], this.mcol2.array[3 * avatarIndex], this.mcol3.array[3 * avatarIndex],
            this.mcol0.array[3 * avatarIndex + 1], this.mcol1.array[3 * avatarIndex + 1], this.mcol2.array[3 * avatarIndex + 1], this.mcol3.array[3 * avatarIndex + 1],
            this.mcol0.array[3 * avatarIndex + 2], this.mcol1.array[3 * avatarIndex + 2], this.mcol2.array[3 * avatarIndex + 2], this.mcol3.array[3 * avatarIndex + 2],
            0, 0, 0, 1
        );
        return matrix;
    }

    getPosition(avatarIndex) {

        return [this.mcol3.array[3 * avatarIndex], this.mcol3.array[3 * avatarIndex + 1], this.mcol3.array[3 * avatarIndex + 2]];

    }

    getRotation(avatarIndex) {

        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);

        let euler = new THREE.Euler(0, 0, 0, 'XYZ');
        euler.setFromQuaternion(quaternion);
        return [euler.x, euler.y, euler.z];

    }

    getScale(avatarIndex) {

        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);
        return [scale.x, scale.y, scale.z];

    }

    reset(avatarIndex) {

        this.mcol0.setXYZ(avatarIndex, 0.1, 0, 0);
        this.mcol1.setXYZ(avatarIndex, 0, 0.1, 0);
        this.mcol2.setXYZ(avatarIndex, 0, 0, 0.1);
        this.mcol3.setXYZ(avatarIndex, 0, 0, 0);

    }

    setMatrix(avatarIndex, matrix) {

        this.mcol0.array[3 * avatarIndex] = matrix.elements[0];
        this.mcol0.array[3 * avatarIndex + 1] = matrix.elements[1];
        this.mcol0.array[3 * avatarIndex + 2] = matrix.elements[2];

        this.mcol1.array[3 * avatarIndex] = matrix.elements[4];
        this.mcol1.array[3 * avatarIndex + 1] = matrix.elements[5];
        this.mcol1.array[3 * avatarIndex + 2] = matrix.elements[6];

        this.mcol2.array[3 * avatarIndex] = matrix.elements[8];
        this.mcol2.array[3 * avatarIndex + 1] = matrix.elements[9];
        this.mcol2.array[3 * avatarIndex + 2] = matrix.elements[10];

        this.mcol3.array[3 * avatarIndex] = matrix.elements[12];
        this.mcol3.array[3 * avatarIndex + 1] = matrix.elements[13];
        this.mcol3.array[3 * avatarIndex + 2] = matrix.elements[14];

    }

    setPosition(avatarIndex, pos) {

        this.mcol3.array[3 * avatarIndex] = pos[0];
        this.mcol3.array[3 * avatarIndex + 1] = pos[1];
        this.mcol3.array[3 * avatarIndex + 2] = pos[2];

    }

    setRotation(avatarIndex, rot) {
        
        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);

        this.dummy.scale.set(scale.x, scale.y, scale.z);
        this.dummy.rotation.set(rot[0], rot[1], rot[2]);
        this.dummy.position.set(position.x, position.y, position.z);
        this.dummy.updateMatrix();

        this.setMatrix(avatarIndex, this.dummy.matrix);

    }

    setScale(avatarIndex, size) {

        let mat4 = this.getMatrix(avatarIndex);
        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);
        let euler = new THREE.Euler(0, 0, 0, 'XYZ');
        euler.setFromQuaternion(quaternion);

        this.dummy.scale.set(size[0], size[1], size[2]);
        this.dummy.rotation.set(euler.x, euler.y, euler.z);
        this.dummy.position.set(position.x, position.y, position.z);
        this.dummy.updateMatrix();

        this.setMatrix(avatarIndex, this.dummy.matrix);
        
    }

    setTexture(avatarIndex, type) { // 设置贴图类型
        
        this.textureType.array[avatarIndex * 4] = type[0]; // 大部分区域
        this.textureType.array[avatarIndex * 4 + 1] = type[1]; // 头部和手部
        this.textureType.array[avatarIndex * 4 + 2] = type[2]; // 裤子
        this.textureType.array[avatarIndex * 4 + 3] = type[3];

    }

    setBodyScale(avatarIndex, scale) { // 设置身体部位缩放
        
        if (this.ifAnimated) {
            this.bodyScale.array[avatarIndex * 4] = scale[0]; 
            this.bodyScale.array[avatarIndex * 4 + 1] = scale[1]; 
            this.bodyScale.array[avatarIndex * 4 + 2] = scale[2]; 
            this.bodyScale.array[avatarIndex * 4 + 3] = scale[3];
        }

    }

    setAnimation(avatarIndex, type, offset) { // 设置动画类型

        this.animationType.array[avatarIndex] = type;
        if (this.ifAnimated) {
            this.animationStartTime.array[avatarIndex] = offset;
        }

    }

    setSpeed(avatarIndex, speed) { // 设置动画速度

        if (this.ifAnimated) {
            this.speed.array[avatarIndex] = speed;
        }

    }

    setMorphTargetWeight(avatarIndex, weight) {

        if (this.ifAnimated && this.ifMorphTarget) {
            this.morphTargetWeight.array[avatarIndex] = weight;
        }

    }

    update() {

        this.mcol0.needsUpdate = true;
        this.mcol1.needsUpdate = true;
        this.mcol2.needsUpdate = true;
        this.mcol3.needsUpdate = true;
        this.textureType.needsUpdate = true;
        this.animationType.needsUpdate = true;
        if (this.ifAnimated) {
            if (this.ifMorphTarget) this.morphTargetWeight.needsUpdate = true;
            this.animationStartTime.needsUpdate = true;
            this.speed.needsUpdate = true;
            this.bodyScale.needsUpdate = true;
        }
        
    }

    move(avatarIndex, dPos) {

        let pos = this.getPosition(avatarIndex);
        this.setPosition(avatarIndex, [pos[0] + dPos[0], pos[1] + dPos[1], pos[2] + dPos[2]]);

    }
    rotation(avatarIndex, dRot) {

        let rot = this.getRotation(avatarIndex);
        this.setRotation(avatarIndex, [rot[0] + dRot[0], rot[1] + dRot[1], rot[2] + dRot[2]]);

    }

}

export { InstancedGroup }