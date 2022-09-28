import {
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  sRGBEncoding,
  LoadingManager,
  MeshStandardMaterial,
  DoubleSide,
  Vector4,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Matrix4,
  Vector2,
  Quaternion,
  _SRGBAFormat,
  Raycaster
} from 'three'

//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Clock } from 'three'
import { VrSpace } from './vrSpace'
import { AvatarManager } from './avatar/AvatarManager.js'
import { SeatManager } from './avatar/SeatManager.js'
import { GLTFLoader } from './lib/GLTFLoaderEx'
import { ZipLoader } from '../lib/ziploader'
import { MMOPlayer } from './network/MMOPlayer'

const TWEEN = require("@tweenjs/tween.js").default;

export class Viewer {
  constructor(el, options) {
    this.el = el
    this.options = options

    this.clock = new Clock()
    this.raycaster = new Raycaster();

    this.scene = new Scene()
    const fov = 60
    this.defaultCamera = new PerspectiveCamera(
      fov,
      el.clientWidth / el.clientHeight,
      0.1,
      700
    )
    this.activeCamera = this.defaultCamera
    this.scene.add(this.defaultCamera)
    this.activeCamera.layers.enableAll()

    this.renderer = window.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.setClearColor(0x1177d6)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(el.clientWidth, el.clientHeight)
    this.renderer.autoClear = false

    this.el.appendChild(this.renderer.domElement)

    this.vrSpace = new VrSpace(this.scene, this.renderer, this.activeCamera)


    this.count = 0;


    this.animate = this.animate.bind(this)
    requestAnimationFrame(this.animate)
    window.addEventListener('resize', this.resize.bind(this), false)


    var _self = this

    /**************************************************************/
    this.setCamera()        //设置摄像机
    this.addSpectators()    //体育场观众
    this.addVrSpace()
    this.addPlayer()



    this.playerMovement = new Vector4(0.0, 0.0, 0.0, 0.0)

    this.onKeyDown = function (event) {


      if (event.keyCode == 87) {
        // W
        _self.playerMovement.x = 1.0
      }
      if (event.keyCode == 83) {
        // S
        _self.playerMovement.y = 1.0
      }
      if (event.keyCode == 65) {
        // A
        _self.playerMovement.z = 1.0
      }
      if (event.keyCode == 68) {
        // D
        _self.playerMovement.w = 1.0
      }

      if (event.keyCode == 32) {


      }
    }

    this.onKeyUp = function (event) {
      if (event.keyCode == 87) {
        _self.playerMovement.x = 0.0;
      }
      if (event.keyCode == 83) {
        // S
        _self.playerMovement.y = 0.0
      }
      if (event.keyCode == 65) {
        // A
        _self.playerMovement.z = 0.0
      }
      if (event.keyCode == 68) {
        // D
        _self.playerMovement.w = 0.0
      }
      if (event.keyCode == 32) {

      }
    }

    this.isWander = true          //漫游
    this.isPlayVideo = false      //播放视频
    this.isPlayAudio = false      //播放音频
    let video = document.getElementById('video');
    let audio = document.getElementById('audio');
    let btns = document.querySelectorAll("button");
    btns.forEach((item, index) => {
      item.addEventListener("click", () => {
        switch (index) {
          case 0:
            _self.Wander(_self.isWander)
            _self.isWander = !_self.isWander
            break;
          case 1:
            _self.SetView(1)
            break;
          case 2:
            _self.SetView(2)
            break;
          case 3:
            if (_self.isPlayVideo == false) {
              video.play()
              video.muted = false
              _self.mainPlayer.lookAtCenter()
              _self.isPlayVideo = true
            }
            else {
              video.pause()
              _self.isPlayVideo = false
            }
            break;
          case 4:
            if (_self.isPlayAudio == false) {
              audio.play()
              _self.isPlayAudio = true
            }
            else {
              audio.pause()
              _self.isPlayAudio = false
            }
            break;
        }
      });
    });

    this.onClick = function (event) {
      let mouse = new Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

      if (_self.vrSpace) {
        _self.raycaster.setFromCamera(mouse, _self.activeCamera);
        let intersects = _self.raycaster.intersectObjects(_self.vrSpace.groups);
        if (intersects.length > 0) {
          window.open('http://pkc.pub', '_blank');
        }
      }
    }

    this.params = {
      outsideCircleRadius: 0.06,
      insideCircleRadius: 0.5,
      moveSpeed: 10,
      rotateSpeed: 0.01
    }
    this.outsideCircle = this.createCircle()
    this.outsideCircle.renderOrder = 9999
    this.outsideCircle.scale.set(
      this.params.outsideCircleRadius,
      this.params.outsideCircleRadius,
      this.params.outsideCircleRadius
    )
    this.outsideCircle.visible = false
    this.insideCircle = this.createCircle()
    this.insideCircle.renderOrder = 10000
    this.insideCircle.scale.set(
      this.params.insideCircleRadius,
      this.params.insideCircleRadius,
      this.params.insideCircleRadius
    )
    this.insideCircle.material.opacity = 0.6
    this.outsideCircle.add(this.insideCircle)
    this.activeCamera.add(this.outsideCircle)

    this.touchStart = function (event) {
      var point = _self.getPointer(event, _self.renderer.domElement)
      if (point.y < 0) {
        _self.startPos = point
        _self.isMoving = true
        if (_self.mainPlayer) {
          _self.mainPlayer.EnableRotate(false)
        }
        _self.moveEvent = event.changedTouches ? event.changedTouches[0] : event
        var worldPos = _self.screen2World(_self.moveEvent)
        //获取摄像机世界坐标
        _self.activeCamera.updateMatrixWorld()
        let cameraPos = _self.activeCamera.getWorldPosition(new Vector3())
        //获取射线方向
        let dir = worldPos.clone().sub(cameraPos).normalize()
        if (!_self.cameraHypoNearLength) {
          let halfWidth =
            Math.tan(_self.activeCamera.fov / 2) * _self.activeCamera.near
          let halfHeight = (halfWidth / window.innerWidth) * window.innerHeight
          let a = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight)
          _self.cameraHypoNearLength = Math.sqrt(
            a * a + _self.activeCamera.near * _self.activeCamera.near
          )
        }
        //外圈
        let pos = cameraPos
          .clone()
          .add(dir.multiplyScalar(_self.cameraHypoNearLength))
        _self.activeCamera.updateMatrixWorld()
        pos.applyMatrix4(
          new Matrix4().copy(_self.activeCamera.matrixWorld).invert()
        )
        _self.outsideCircle.position.copy(pos)
        _self.outsideCircle.visible = true
        //内圈
        _self.insideCircle.position.set(0, 0, 0.001)
        _self.insideCircle.quaternion.copy(new Quaternion())
        _self.outsideCircle.updateMatrixWorld()
      }
    }
    this.touchMove = function (event) {
      let point = _self.getPointer(event, _self.renderer.domElement)
      if (_self.isMoving) {
        let angle = Math.atan(
          Math.abs(point.y - _self.startPos.y) /
          Math.abs(point.x - _self.startPos.x)
        )
        let x = Math.cos(angle)
        let y = Math.sin(angle)
        if (point.y < _self.startPos.y) y *= -1
        if (point.x < _self.startPos.x) x *= -1
        _self.insideCircle.position.set(x, y, 0.001)
        _self.moveSpeed = new Vector2(x, y).normalize()
        _self.playerMovement = new Vector4(0.0, 0.0, 0.0, 0.0)
        if (_self.moveSpeed.y > 0) {
          _self.playerMovement.x = _self.moveSpeed.y
        } else if (_self.moveSpeed.y < 0) {
          _self.playerMovement.y = -_self.moveSpeed.y
        }

        if (_self.moveSpeed.x < 0) {
          _self.playerMovement.z = -_self.moveSpeed.x
        } else if (_self.moveSpeed.x > 0) {
          _self.playerMovement.w = _self.moveSpeed.x
        }
      }
    }

    this.touchEnd = function (event) {
      let mouse = new Vector2();
      let e = event.changedTouches ? event.changedTouches[0] : event;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
      if (_self.vrSpace) {
        _self.raycaster.setFromCamera(mouse, _self.activeCamera);

        let intersects = _self.raycaster.intersectObjects(_self.vrSpace.groups);
        if (intersects.length > 0) {
          window.open('http://pkc.pub', '_blank');
        }
      }
      if (_self.outsideCircle) {
        _self.outsideCircle.visible = false
      }
      _self.isMoving = false
      if (_self.mainPlayer) _self.mainPlayer.EnableRotate(true)
      _self.playerMovement = new Vector4(0.0, 0.0, 0.0, 0.0)
    }

    this.renderer.domElement.addEventListener('touchstart', this.touchStart, false )
    this.renderer.domElement.addEventListener('touchend', this.touchEnd, false)
    this.renderer.domElement.addEventListener('touchmove',this.touchMove,false)
    document.addEventListener('keydown', this.onKeyDown, false)
    document.addEventListener('keyup', this.onKeyUp, false)
    document.addEventListener('click', this.onClick, true)
  }

  animate(time) {
    requestAnimationFrame(this.animate)
    var delta = this.clock.getDelta()
    this.render()

    if (this.vrSpace) {
      this.vrSpace.update(time)
    }
    if (this.avatarManager) {
      let lodinfo = this.avatarManager.updateLOD()
    }

    if (this.mainPlayer) {
      this.mainPlayer.UpdateMovement(
        delta,
        this.playerMovement,
        this.vrSpace.collider
      )
    }
    if (this.count > 0) {
      this.mainPlayer.SetView(new Vector3(0, 0, 23), new Vector3(0, 0, 25))
      this.count++
      if (this.count == 3) {
        this.count = 0
      }
    }
    else if (this.count < 0) {
      this.mainPlayer.SetView(new Vector3(-10, 0, 0), new Vector3(-12, 0, 0))
      this.count--
      if (this.count == -3) {
        this.count = 0
      }
    }
    TWEEN.update()
  }

  render() {
    this.renderer.clear()
    this.renderer.render(this.scene, this.activeCamera)
  }

  resize() {
    const { clientHeight, clientWidth } = this.el.parentElement
    this.defaultCamera.aspect = clientWidth / clientHeight
    this.defaultCamera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  addVrSpace() {
    switch (this.vrSpaceId) {
      case '0':
        this.vrSpace.AddStadium()
        break
      default:
        this.vrSpace.AddStadium()
        break
    }
  }

  setCamera() {
    this.defaultCamera.position.copy(new Vector3(80, 80, 80))
    this.defaultCamera.lookAt(new Vector3())
    this.activeCamera = this.defaultCamera
  }

  async addSpectators() {
    window.c = this.activeCamera
    this.avatarManager = new AvatarManager(
      new SeatManager().positions,
      window.c
    )
    this.scene.add(this.avatarManager.avatar)
    await this.avatarManager.init();
    this.avatarManager.createSuperLowAvatar(); // 人物低模
    this.avatarManager.createLowAvatar(); // 人物低模
    this.avatarManager.createMediumAvatar(); // 人物中模
    this.avatarManager.createHighAvatar(); // 人物高模
  }

  addPlayer() {
    let self = this
    let url = 'assets/players/MB05163.zip'
    if (url.toLowerCase().endsWith('.zip')) {
      //console.log(url)
      new Promise(function (resolve, reject) {
        if (url.match(/\.zip$/)) {
          new ZipLoader().load(url, function (xhr) {
          }).then(function (zip) {
            let manager = new LoadingManager();
            manager.setURLModifier(zip.urlResolver);
            let loader = new GLTFLoader(manager)
            loader.setCrossOrigin('anonymous')
            loader.load(zip.find(/\.(gltf|glb)$/i)[0], gltf => {
              self.mainPlayer = new MMOPlayer({ raw: gltf }, {
                camera: self.activeCamera,
                renderer: self.renderer
              })
            })
          });
        }
      })
    }
  }

  createCircle() {
    let vertex = [0, 0, 0]
    let index = []
    const radius = 1
    const segment = 32
    const angleOffset = 360 / segment
    let angle = 0
    for (var i = 0; i < segment; i++) {
      angle = i * angleOffset
      let rag = (angle / 180) * Math.PI
      let x = Math.cos(rag) * radius
      let y = Math.sin(rag) * radius
      vertex.push(x, y, 0)
      if (i != segment - 1) {
        index.push(i + 1, 0, i + 2)
      } else {
        index.push(i + 1, 0, 1)
      }
    }
    var geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(vertex), 3)
    )
    geometry.setIndex(new BufferAttribute(new Uint16Array(index), 1))
    let mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({
        transparent: true,
        opacity: 0.3,
        side: DoubleSide
      })
    )
    return mesh
  }
  getPointer(event, domElement) {
    if (document.pointerLockElement) {
      return {
        x: 0,
        y: 0
      }
    } else {
      var pointer = event.changedTouches ? event.changedTouches[0] : event
      var rect = domElement.getBoundingClientRect()
      return {
        x: ((pointer.clientX - rect.left) / rect.width) * 2 - 1,
        y: (-(pointer.clientY - rect.top) / rect.height) * 2 + 1
      }
    }
  }
  screen2World(event) {
    const x = event.clientX
    const y = event.clientY
    const x1 = (x / window.innerWidth) * 2 - 1
    const y1 = -(y / window.innerHeight) * 2 + 1
    const vec = new Vector3(x1, y1, 0.5)
    return vec.unproject(this.activeCamera)
  }
  Wander(bool) {
    if (bool == true) {
      this.controls = this.mainPlayer.GetControls(false)
      this.controls.saveState()
      this.controls.enableZoom = true
      this.controls.enablePan = true
      this.controls.rotateSpeed = 1;
      let p1 = new Vector3(-31.785184004250954, 1.786182905274199, 52.68140553300441)
      let p2 = new Vector3(31.755517229404916, 1.786182905274199, 52.70747814795368)
      let p3 = new Vector3(31.88208891410038, 1.786182905274199, -52.58524063913275)
      let p4 = new Vector3(-31.72686587407099, 1.786182905274199, -52.727687972212905)
      let t1 = new Vector3(-31.146574335677084, 1.786182905274199, 51.95305940092583)
      let t2 = new Vector3(31.146574335677084, 1.786182905274199, 51.95305940092583)
      let t3 = new Vector3(31.146574335677084, 1.786182905274199, -51.95305940092583)
      let t4 = new Vector3(-31.146574335677084, 1.786182905274199, -51.95305940092583)
      this.animateCamera(p1, p2, t1, t2, 5000 * 2, 1)
      this.animateCamera(p2, p3, t2, t3, 5000 * 2, 1)
      this.animateCamera(p3, p4, t3, t4, 5000 * 2, 1)
      this.animateCamera(p4, p1, t4, t1, 5000 * 2, 1)
      this.tween.chain(this.startTween)
    }
    else {
      TWEEN.removeAll();
      this.tween = null;
      this.controls = this.mainPlayer.GetControls(true)
      this.controls.reset()
      this.controls.enableZoom = false
      this.controls.enablePan = false
      this.controls.rotateSpeed = 0.2;
    }
  }
  animateCamera(current1, current2, target1, target2, time, flag, cb) {
    //   if (this.operating) return false;
    //   this.operating = true;
    let positionVar = {
      x1: current1.x,
      y1: current1.y,
      z1: current1.z,
    };
    let positionTo = {
      x1: current2.x,
      y1: current2.y,
      z1: current2.z,
    };
    if (target1) {
      positionVar = Object.assign(positionVar, {
        x2: target1.x,
        y2: target1.y,
        z2: target1.z,
      });
    }
    if (target2) {
      positionTo = Object.assign(positionTo, {
        x2: target2.x,
        y2: target2.y,
        z2: target2.z,
      });
    }
    var tween = new TWEEN.Tween(positionVar);
    tween.to(positionTo, time);
    tween.onUpdate((object) => {
      // this.controls.enabled = false;
      this.activeCamera.position.x = object.x1;
      this.activeCamera.position.y = object.y1;
      this.activeCamera.position.z = object.z1;
      this.activeCamera.translateZ(0.5)
      if (target1 && target2) {
        this.controls.target.x = object.x2;
        this.controls.target.y = object.y2;
        this.controls.target.z = object.z2;
      }
      this.controls.update();
    });
    tween.onComplete(() => {
      this.tween = null;
      if (cb) cb();
    });
    if (flag == 1) {
      tween.easing(TWEEN.Easing.Linear.None);
    }
    else if (flag == 2) {
      tween.easing(TWEEN.Easing.Cubic.Out);
    }
    if (!this.tween) {
      this.tween = tween;
      this.startTween = tween;
      tween.start();
    }
    else {
      this.tween.chain(tween)
      this.tween = tween;
    }
  }
  SetView(bool) {
    if (bool == 1)
      this.count++;
    else if (bool == 2) {
      this.count--;
    }
  }



}
