import * as THREE from "three";
class LODController {

    constructor( positions, camera ) {

        this.positions = positions;
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        // const gpu = new GPU();
        this.planeIndecies = [ 0, 1, 2, 3 ]; // 用哪些面进行视锥剔除 0:右 1:左 2:下 3:上 4:远 5:近
        this.lodLevels = [60, 900,6100] // LOD分为三等, 此数组数字为距离平方
        var scope=this
        window.update_lod_distance=(number)=>{
            scope.lodLevels[2]=number
        }

    }

    computeDistanceCPU( cameraPosition, frustumPlanes ) {

        let result = [];
        let camera = new THREE.Vector3( ...cameraPosition );

        for ( let i = 0; i < this.positions.length; i++ ) {

            let flag = true;
            let point = new THREE.Vector3( ...(this.positions[i]) );

            // 视锥剔除
            for ( let j = 0; j < this.planeIndecies.length; j++ ) {
                if ( this.frustum.planes[ this.planeIndecies[j] ].distanceToPoint( point ) < -2 ) {
                    result.push( -1 );
                    flag = false;
                    break;
                }
            }

            // LOD
            if ( flag ) {
                let distance = camera.distanceToSquared( point );
                let lod = 3;
                if ( distance < this.lodLevels[0] ) lod = 0;
                else if ( distance < this.lodLevels[1] ) lod = 1;
                else if ( distance < this.lodLevels[2] ) lod = 2;
                result.push( lod )
            }

        }

        return result;

    }

    update() {

        // 求视锥体
        let matrix = new THREE.Matrix4().multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
        this.frustum.setFromProjectionMatrix( matrix );

        let frustumPlanes = [];
        this.frustum.planes[2].constant += 4;
        for ( let i = 0; i < this.planeIndecies.length; i++ ) {
            // 每个面由一个四维向量表示(法向量+与原点距离)
            frustumPlanes.push( 
                ...(this.frustum.planes[this.planeIndecies[i]].normal.toArray()), 
                this.frustum.planes[this.planeIndecies[i]].constant 
            );
        }

        return this.computeDistanceCPU( this.camera.position.toArray(), frustumPlanes );

    }

    computeFrustum() {

        let frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix( this.camera.projectionMatrix );
        return frustum;

    }

}

export { LODController };