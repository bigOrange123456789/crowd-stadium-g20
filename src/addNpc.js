
import { 
  Vector3,
  MeshBasicMaterial,
  Mesh,
  AnimationMixer,
  PlaneGeometry,
  CatmullRomCurve3,
  TextureLoader,
  Object3D,

} from 'three'

import { MMOPlayerMgr, MMOPlayer } from './network/MMOPlayer'
import { clone as SkeletonUtilsClone } from 'three/examples/jsm/utils/SkeletonUtils'

export class AddNpc {
  constructor(scene, npcs, camera,count) {
    this.npcs = npcs
    this.scene = scene
    this.group = []
    this.camera = camera
    this.count=count
    this.addNpc()
  }
  addNpc() {
    for (let i = 0; i < this.count; i++) {
      let playerAsset = this.getChar().raw
      let renderableRoot = new Object3D()
      renderableRoot.position.copy(MMOPlayerMgr.GetSpawnPoint())
      let obj = SkeletonUtilsClone(
        playerAsset.scene ? playerAsset.scene : playerAsset
      )
      renderableRoot.add(obj)
      this.scene.add(renderableRoot)
      obj.mixer = new AnimationMixer(obj)
      obj.animationClips = {}
      obj.clipActions = {}
      obj.activeAction = null
      obj.animationObject = playerAsset.animations
      obj.animationObject.forEach(clip => {
        obj.animationClips[clip.name] = clip
        obj.clipActions[clip.name] = obj.mixer.clipAction(clip)
      })

      obj.clipActions["Walking"].play()
      this.updateTarget(obj)
      obj.walk = true

      this.group.push(obj)
      // Add fake shadow
      if (true) {
        const texture = new TextureLoader().load('assets/players/shadow.png')
        const shadowMtl = new MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.5
        })
        const geometry = new PlaneGeometry(0.9, 0.9)
        const shadow = new Mesh(geometry, shadowMtl)
        shadow.rotation.x = -Math.PI * 0.5
        shadow.position.y = 0.1;
        renderableRoot.add(shadow)
      }
    }
  }
  getChar() {
    let k = [this.npcs[2], this.npcs[4], this.npcs[7], this.npcs[8], this.npcs[9]]
    let char = Math.floor(Math.random() * (k.length))
    if (char == 0)
      k[char].raw.scene.scale.set(-1, 1, -1)
    return k[char]
  }
  action(obj, number) {
    let s = this;
    switch (number) {
      case 0:
        s.playAction(obj, "Cheering")
        break;
      case 1:
        s.playAction(obj, "Idle")
        break;
      case 2:
        s.playAction(obj, "Waving")
        break;
      case 3:
        s.playAction(obj, "Talking")
        break;
      case 4:
        s.playAction(obj, "Clapping")
        break;
    }
  }

  playAction(obj, action) {
    let s = this;
    obj.walk = false
    if (!obj.clipActions[action]) {
      action = "Waving"
    }
    let animationDuration = obj.clipActions[action]._clip.duration * 1000 * 2
    this.FadeToAction(obj.clipActions["Walking"], obj.clipActions[action], 0.3)
    setTimeout(function () {
      s.OnAnimationOver(obj, action)
    }, animationDuration)
  }

  OnAnimationOver(obj, action) {
    this.FadeToAction(obj.clipActions[action], obj.clipActions["Walking"], 0.3)
    obj.walk = true
  }

  FadeToAction(currentAction, nextAction, duration) {
    if (currentAction && currentAction != nextAction) {
      currentAction.fadeOut(duration)
    }

    nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play()

  }

  updateTarget(obj) {
    obj.curve = new CatmullRomCurve3([
      obj.parent.position.clone(),
      MMOPlayerMgr.GetSpawnPoint()
    ]);
    let v = new Vector3().lerpVectors(obj.curve.getPointAt(0), obj.curve.getPointAt(1), Math.random() * 0.5)
    v.x += 5
    v.z += 5
    obj.curve = new CatmullRomCurve3([
      obj.curve.getPointAt(0),
      v,
      obj.curve.getPointAt(1)
    ]);
    obj.process = 0;
    obj.curve.getPoints(20)
    obj.speed = obj.curve.getLength() < 20 ? (0.0007 + obj.curve.getLength() * 0.00002) : (0.0008 - obj.curve.getLength() * 0.00001 / 3)
  }

  getDis(obj) {
    return obj.position.clone().distanceTo(new Vector3(0, 0, 0))
  }
  update(delta) {
    for (let i = 0; i < this.group.length; i++) {
      this.group[i].mixer.update(delta)
      if (this.group[i].walk == true) {
        if (Math.random() < 0.003) {
          this.action(this.group[i], Math.floor(Math.random() * 5))
        }
        else if (this.group[i].process <= 1 - this.group[i].speed*delta*30) {
          let point = this.group[i].curve.getPointAt(this.group[i].process) //获取样条曲线指定点坐标，作为相机的位置
          let pointBox = this.group[i].curve.getPointAt(this.group[i].process + this.group[i].speed*delta*30) //获取样条曲线指定点坐标
          this.group[i].parent.position.set(point.x, point.y, point.z)
          this.group[i].parent.lookAt(pointBox.x, pointBox.y, pointBox.z)
          this.group[i].process += this.group[i].speed*delta*30
          if (point.distanceTo(new Vector3(0, 0, 0)) <= 8 && pointBox.distanceTo(new Vector3(0, 0, 0)) <= point.distanceTo(new Vector3(0, 0, 0))) {
            this.updateTarget(this.group[i])
          }
        }
        else {
          this.updateTarget(this.group[i])
        }
      }
    }
  }
}
