import {
  Vector3,
  Mesh,
  LoadingManager,
  FloatType,
  PMREMGenerator,
  VideoTexture,
  CatmullRomCurve3,
  HalfFloatType,
  Object3D
} from 'three'


import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from './lib/GLTFLoaderEx'
import { ZipLoader } from '../lib/ziploader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MMOPlayerMgr, MMOPlayer } from './network/MMOPlayer'
import { AmbientLight } from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshBVH } from 'three-mesh-bvh'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'

export class VrSpace {
  constructor(_scene, _renderer, _camera) {
    this.scene = _scene
    this.renderer = _renderer
    this.camera = _camera
    this.groups = []
    this.progress1 = 0
    this.progress2 = 0
  }

  createBVH(gltfScene) {
    const geometries = []
    gltfScene.traverse(function (node) {
      if (node.geometry) {
        const cloned = node.geometry.clone()
        cloned.applyMatrix4(node.matrixWorld)
        for (const key in cloned.attributes) {
          if (key !== 'position') {
            cloned.deleteAttribute(key)
          }
        }
        geometries.push(cloned)
      }
    })
    // create the merged geometry
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
      geometries,
      false
    )
    mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {
      lazyGeneration: false
    })
    this.collider = new Mesh(mergedGeometry)
    this.collider.material.wireframe = true
    this.collider.material.opacity = 0.5
    this.collider.material.transparent = true
  }

  getCubeMapTexture(evnMapAsset) {
    function isMobile() {
      let check = false
        ; (function (a) {
          if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
              a
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
              a.substr(0, 4)
            )
          )
            check = true
        })(navigator.userAgent || navigator.vendor || window.opera)
      if (check == false) {
        check =
          [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
          ].includes(navigator.platform) ||
          // iPad on iOS 13 detection
          (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      }
      return check
    }

    var isIosPlatform = isMobile()

    var path = evnMapAsset

    var scope = this
    return new Promise((resolve, reject) => {
      if (!path) {
        resolve({ envMap: null })
      } else if (path.indexOf('.hdr') >= 0) {
        new RGBELoader()
          .setDataType(isIosPlatform ? HalfFloatType : FloatType)
          .load(
            path,
            texture => {
              scope.pmremGenerator = new PMREMGenerator(scope.renderer)
              scope.pmremGenerator.compileEquirectangularShader()

              const envMap =
                scope.pmremGenerator.fromEquirectangular(texture).texture
              scope.pmremGenerator.dispose()

              resolve({ envMap })
            },
            undefined,
            reject
          )
      } else if (path.indexOf('.exr') >= 0) {
        new EXRLoader()
          .setDataType(isIosPlatform ? HalfFloatType : FloatType)
          .load(
            path,
            texture => {
              scope.pmremGenerator = new PMREMGenerator(scope.renderer)
              scope.pmremGenerator.compileEquirectangularShader()

              const envMap =
                scope.pmremGenerator.fromEquirectangular(texture).texture
              scope.pmremGenerator.dispose()

              resolve({ envMap })
            },
            undefined,
            reject
          )
      } else if (path.indexOf('.png') >= 0) {
        new RGBMLoader(this.options.manager).setMaxRange(8).load(
          path,
          texture => {
            scope.pmremGenerator = new PMREMGenerator(scope.renderer)
            scope.pmremGenerator.compileEquirectangularShader()

            const envMap =
              scope.pmremGenerator.fromEquirectangular(texture).texture
            scope.pmremGenerator.dispose()

            resolve({ envMap })
          },
          undefined,
          reject
        )
      }
    })
  }

  AddStadium() {
    var _self = this

    this.url = "assets/models/room_split/";
    _self.room = new Object3D();
    _self.scene.add(_self.room)
    const modelLoader = new GLTFLoader();
    for (var i = 536; i <= 543; i++) {
      modelLoader.load(this.url + i + ".glb", gltf => {
        _self.room.add(gltf.scene.children[0])
      });
    }
    setTimeout(() => {
      for (var i = 0; i <= 50; i++) {
        modelLoader.load(this.url + i + ".glb", gltf => {
          _self.room.add(gltf.scene.children[0])
        });
      }
    }, 100)
    setTimeout(() => {
      for (var i = 51; i <= 250; i++) {
        modelLoader.load(this.url + i + ".glb", gltf => {
          _self.room.add(gltf.scene.children[0])
        });
      }
    }, 500)
    let video = document.getElementById('video');
    let texture = new VideoTexture(video);
    texture.flipY = false

    var vrSceneUrl = 'assets/models/gym/Stadium_002.zip'
    new Promise(function (resolve, reject) {
      var loadingManager = new LoadingManager()
      //loadingManager.setURLModifier('')
      if (vrSceneUrl.toLowerCase().endsWith('.zip')) {
        new Promise(function (resolve, reject) {
          if (vrSceneUrl.match(/\.zip$/)) {
            new ZipLoader().load(vrSceneUrl, function (xhr) {
            }).then(function (zip) {
              loadingManager.setURLModifier(zip.urlResolver);
              resolve({
                fileUrl: zip.find(/\.(gltf|glb)$/i)[0],
              });
            });
          } else {
            resolve(url);
          }
        }).then(function (congigJson) {
          const loader = new GLTFLoader(loadingManager)
          loader.setCrossOrigin('anonymous')
          loader.setAsyncLightMap(true, 3, 0, 6.0)
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath('lib/draco/')
          loader.load(
            congigJson.fileUrl,
            gltf => {
              const scene = gltf.scene || gltf.scenes[0]
              _self.scene.add(scene)
              _self.room.visible = false
              scene.updateMatrixWorld(true)

              if (true) {
                // //35、36、47、43
                scene.traverse(function (node) {
                  // }
                  if (node.material) {
                    node.material.envMapIntensity = 0.1
                    node.material.needUpdate = true

                    if (
                      node.name == 'Quad' ||
                      node.name == 'Quad_1' ||
                      node.name == 'Quad_2'
                    ) {

                      node.material.map = texture
                    }

                    if (node.name == 'grass') {
                      node.material.map.generateMipmaps = true
                      node.material.map.needsUpdate = true

                    }
                    if (node.name == "red_top") {
                      _self.groups.push(node)
                    }
                  }
                })
              }
              _self.createBVH(scene)
              MMOPlayerMgr.SetSpawnPoints(null)
            },
            function (xhr) { },
            null
          )
        });
      }
    })

    let ship1 = 'assets/models/airship.zip'
    new Promise(function (resolve, reject) {
      var loadingManager = new LoadingManager()
      //  loadingManager.setURLModifier('')
      if (ship1.toLowerCase().endsWith('.zip')) {
        new Promise(function (resolve, reject) {
          if (ship1.match(/\.zip$/)) {
            new ZipLoader().load(ship1, function (xhr) {
            }).then(function (zip) {
              loadingManager.setURLModifier(zip.urlResolver);
              resolve({
                fileUrl: zip.find(/\.(gltf|glb)$/i)[0],
              });
            });
          } else {
            resolve(url);
          }
        }).then(function (congigJson) {
          const loader = new GLTFLoader(loadingManager)
          loader.setCrossOrigin('anonymous')
          loader.setAsyncLightMap(true, 3, 0, 6.0)
          const dracoLoader = new DRACOLoader()
          dracoLoader.setDecoderPath('lib/draco/')
          loader.load(
            congigJson.fileUrl,
            gltf => {
              const scene = gltf.scene || gltf.scenes[0]
              _self.scene.add(scene)
              scene.scale.set(30, 30, 30)
              scene.position.y += 5
              scene.updateMatrixWorld(true)
              _self.curve = new CatmullRomCurve3([
                new Vector3(-29.51734222405338, 5, -48.788006466597366),
                new Vector3(-28.394040548166654, 5, -11.503826184040582),
                new Vector3(29.792911534779478, 5, -11.503826184040582),
                new Vector3(29.081552930479734, 5, -46.77411452370517)
              ])
              _self.curve.getPoints(100)
              _self.curve.closed = true
              _self.ship1 = scene
              _self.ship2 = scene.clone()
              _self.scene.add(_self.ship2)
              _self.curve2 = new CatmullRomCurve3([
                new Vector3(29.36078165141229, 5, 44.10162769367898),
                new Vector3(31.10225081551925, 5, 11.291858664157363),
                new Vector3(-29.535992720684533, 5, 11.291858664157363),
                new Vector3(-29.69667802811644, 5, 43.260899156775096)
              ])
              _self.curve2.getPoints(100)
              _self.curve2.closed = true
            },
            function (xhr) { },
            null
          )
        });
      }
    })

    var ball1 = 'assets/models/balloon1.zip'
    new Promise(function (resolve, reject) {
      var loadingManager = new LoadingManager()
      // loadingManager.setURLModifier('')
      if (ball1.toLowerCase().endsWith('.zip')) {
        new Promise(function (resolve, reject) {
          if (ball1.match(/\.zip$/)) {
            new ZipLoader().load(ball1, function (xhr) {
            }).then(function (zip) {
              loadingManager.setURLModifier(zip.urlResolver);
              resolve({
                fileUrl: zip.find(/\.(gltf|glb)$/i)[0],
              });
            });
          } else {
            resolve(url);
          }
        }).then(function (congigJson) {
          const loader = new GLTFLoader(loadingManager)
          loader.setCrossOrigin('anonymous')
          loader.setAsyncLightMap(true, 3, 0, 6.0)
          const dracoLoader = new DRACOLoader()
          dracoLoader.setDecoderPath('lib/draco/')
          loader.load(
            congigJson.fileUrl,
            gltf => {
              const scene = gltf.scene || gltf.scenes[0]
              _self.scene.add(scene)
              scene.scale.set(1, 1, 1)
              scene.position.x = 45
              scene.position.z = 20
              scene.updateMatrixWorld(true)
              _self.ball1 = scene
            },
            function (xhr) { },
            null
          )
        });
      }
    })


    var ball2 = 'assets/models/episode_67_-_hot_air_ballon.zip'
    new Promise(function (resolve, reject) {
      var loadingManager = new LoadingManager()
      //   loadingManager.setURLModifier('')
      if (ball2.toLowerCase().endsWith('.zip')) {
        new Promise(function (resolve, reject) {
          if (ball2.match(/\.zip$/)) {
            new ZipLoader().load(ball2, function (xhr) {
            }).then(function (zip) {
              loadingManager.setURLModifier(zip.urlResolver);
              resolve({
                fileUrl: zip.find(/\.(gltf|glb)$/i)[0],
              });
            });
          } else {
            resolve(url);
          }
        }).then(function (congigJson) {
          const loader = new GLTFLoader(loadingManager)
          loader.setCrossOrigin('anonymous')
          loader.setAsyncLightMap(true, 3, 0, 6.0)
          const dracoLoader = new DRACOLoader()
          dracoLoader.setDecoderPath('lib/draco/')
          loader.load(
            congigJson.fileUrl,
            gltf => {
              const scene = gltf.scene || gltf.scenes[0]
              _self.scene.add(scene)
              scene.position.x = -45
              scene.position.z = -20
              scene.scale.set(1, 1, 1)
              scene.updateMatrixWorld(true)
              _self.ball2 = scene
              _self.ball3 = scene.clone();
              _self.ball3.position.set(0, 0, 0)
            },
            function (xhr) { },
            null
          )
        });
      }
    })




    this.getCubeMapTexture('assets/environment/skybox.hdr').then(
      ({ envMap }) => {
        this.scene.background = envMap
      }
    )
    this.getCubeMapTexture('assets/environment/footprint_court_2k.hdr').then(
      ({ envMap }) => {
        _self.scene.environment = envMap
      }
    )
    //const directionalLight0 = new DirectionalLight(0xffffff, 1.7)
    //directionalLight0.position.set(0.5, 1.2, 0.5)
    ///this.scene.add(directionalLight0);
    //const directionalLight1 = new DirectionalLight(0xffffff, 0.8)
    //directionalLight1.position.set(-0.5, 1.2, 0.5)
    //this.scene.add(directionalLight1);
    const ambientLight = new AmbientLight(0xffffff, 0.9)
    this.scene.add(ambientLight)
  }

  update(time) {


    if (this.ship1 && this.curve) {
      let point = this.curve.getPointAt(this.progress1) //获取样条曲线指定点坐标，作为相机的位置
      let pointBox = this.curve.getPointAt((this.progress1 + 0.0004) % 1) //获取样条曲线指定点坐标
      this.ship1.position.set(point.x, point.y + 5, point.z)
      this.ship1.lookAt(pointBox.x, pointBox.y + 5, pointBox.z)
      this.progress1 = (this.progress1 + 0.0004) % 1
    }
    if (this.ship2 && this.curve2) {
      let point2 = this.curve2.getPointAt(this.progress2) //获取样条曲线指定点坐标，作为相机的位置
      let pointBox2 = this.curve2.getPointAt((this.progress2 + 0.0004) % 1) //获取样条曲线指定点坐标
      this.ship2.position.set(point2.x, point2.y + 5, point2.z)
      this.ship2.lookAt(pointBox2.x, pointBox2.y + 5, pointBox2.z)
      this.progress2 = (this.progress2 + 0.0004) % 1
    }

    if (this.ball1) {
      this.ball1.position.y = Math.cos(time * 0.001) * 3 + 20
    }
    if (this.ball2) {
      this.ball2.position.y = Math.cos(time * 0.001) * 3 + 20
    }
    if (this.ball3) {
      this.ball3.position.y = Math.cos(time * 0.001) * 3 + 20
    }
  }
}
