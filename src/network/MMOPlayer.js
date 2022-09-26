
import { clone as SkeletonUtilsClone } from 'three/examples/jsm/utils/SkeletonUtils'

import {
  Object3D,

} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import {
  Vector3,
  Line3,
  Box3,
  Matrix4,
} from 'three'

class MMOPlayerMgr {
  static LocalPlayer = null
  static NetworkPlayers = []

  static SpawnPoints = null

  static RefreshInterval = 150; //ms

  constructor() { }

  static SetSpawnPoints(spawnPoints) {
    MMOPlayerMgr.SpawnPoints = spawnPoints
  }

  static GetSpawnPoint() {
    if (MMOPlayerMgr.SpawnPoints && MMOPlayerMgr.SpawnPoints.length > 0) {
      function getRandomInt(min, max) {
        min = Math.ceil(min)
        max = Math.floor(max)
        return Math.floor(Math.random() * (max - min)) + min
      }

      var spId = getRandomInt(0, MMOPlayerMgr.SpawnPoints.length)

      return new Vector3(
        MMOPlayerMgr.SpawnPoints[spId].x,
        MMOPlayerMgr.SpawnPoints[spId].y,
        MMOPlayerMgr.SpawnPoints[spId].z
      )
    } else {
      var xSize = 70
      var zSize = 100

      let position = new Vector3(
        Math.random() * xSize - xSize * 0.5,
        0.0,
        Math.random() * zSize - zSize * 0.5
      )


      if (position.distanceTo(new Vector3(0, 0, 0)) <= 8) {
        position = new Vector3(20, 0, 20)
      }

      return position
    }
  }

  static Update(delta) {

    for (var i = 0; i < MMOPlayerMgr.NetworkPlayers.length; ++i) {
      MMOPlayerMgr.NetworkPlayers[i].UpdateSyncMovement(delta);
    }
  }
}

class PlayerCamera {
  static eType = {
    TPS: 0,
    FPS: 1
  }

  constructor(_renderer, _renderableObject) {
    this.renderer = _renderer

    this.cameraOffset = new Vector3(0.0, 1.8, 4.0)

    this.playerHalfHeight = 0.8

    this.forwardFlag = true
    this.backwardFlag = false
    this.rightFlag = false
    this.leftFlag = false

    this.forward = 0
    this.backward = 0
    this.right = 0
    this.left = 0

    this.isSyncNeeded = false

    this.sceneCollider = null


    this.enableUpdate = true
  }

  SetCamera(_renderableObject, _camera, _type) {
    var scope = this

    this.renderableObject = _renderableObject
    this.camera = _camera
    this.type = _type

    switch (_type) {
      case "TPS":
        {
          if (this.camera) {
            this.camera.position.addVectors(
              this.renderableObject.position,
              this.cameraOffset
            )

            this.tpsControls = new OrbitControls(
              this.camera,
              this.renderer.domElement
            )
            this.tpsControls.autoRotate = false
            this.tpsControls.autoRotateSpeed = -10
            this.tpsControls.screenSpacePanning = true

            this.tpsControls.maxPolarAngle = Math.PI * 0.49
            this.tpsControls.minPolarAngle = Math.PI * 0.1

            this.tpsControls.minDistance = 1.0
            this.tpsControls.maxDistance = 4.0

            this.tpsControls.rotateSpeed = 0.2

            this.tpsControls.enablePan = false

            var playerTaget = new Vector3().addVectors(
              this.renderableObject.position,
              new Vector3(0.0, this.playerHalfHeight, 0.0)
            )

            this.tpsControls.target = playerTaget
            this.camera.lookAt(playerTaget)
          }
        }
        break

      case "FPS":
        {
          if (this.camera) {
            this.cameraOffset = new Vector3(0.0, 1.5, 0.1)
            this.camera.position.addVectors(
              this.renderableObject.position,
              this.cameraOffset
            )
            this.fpsControls = new OrbitControls(
              this.camera,
              this.renderer.domElement
            )
            this.fpsControls.autoRotate = false
            this.fpsControls.autoRotateSpeed = -10
            this.fpsControls.screenSpacePanning = true

            this.fpsControls.maxPolarAngle = Math.PI * 0.6
            this.fpsControls.minPolarAngle = Math.PI * 0.1

            this.fpsControls.minDistance = 0.1
            this.fpsControls.maxDistance = 4.0

            this.fpsControls.rotateSpeed = 0.2

            this.fpsControls.enablePan = false

            this.fpsControls.enableZoom = false

            var playerTaget = new Vector3().addVectors(
              this.renderableObject.position,
              new Vector3(0.0, this.playerHalfHeight + 1, 0.0)
            )

            this.renderableObject.visible = false

            this.fpsControls.target = playerTaget
            this.camera.lookAt(playerTaget)
          }
        }
        break
    }
  }

  UpdateTPS(movementStatus, collider, deltaTime) {
    //if (this.renderableObject && this.tpsControls)
    {
      if (movementStatus.x > 0.0) {
        if (this.forwardFlag == false) {
          this.forwardFlag = true
        }
      } else {
        if (this.forwardFlag == true) {
          this.forwardFlag = false
        }
      }

      if (movementStatus.y > 0.0) {
        if (this.backwardFlag == false) {
          this.backwardFlag = true
        }
      } else {
        if (this.backwardFlag == true) {
          this.backwardFlag = false
        }
      }

      if (movementStatus.z > 0.0) {
        if (this.leftFlag == false) {
          this.leftFlag = true
        }
      } else {
        if (this.leftFlag == true) {
          this.leftFlag = false
        }
      }

      if (movementStatus.w > 0.0) {
        if (this.rightFlag == false) {
          this.rightFlag = true
        }
      } else {
        if (this.rightFlag == true) {
          this.rightFlag = false
        }
      }

      var moveSpeed = 0.05

      var playerForward = new Vector3()
      this.renderableObject.getWorldDirection(playerForward)
      playerForward.y = 0
      playerForward.normalize()

      var cameraDirection = new Vector3()
      this.camera.getWorldDirection(cameraDirection)
      cameraDirection.y = 0

      var fbDirection = new Vector3().copy(cameraDirection)

      var lrDirection = new Vector3(fbDirection.z, 0.0, -fbDirection.x)

      fbDirection.multiplyScalar(
        (this.forwardFlag ? 1.0 : 0.0) + (this.backwardFlag ? -1.0 : 0.0)
      )
      fbDirection.normalize()

      lrDirection.multiplyScalar(
        (this.leftFlag ? 1.0 : 0.0) + (this.rightFlag ? -1.0 : 0.0)
      )
      lrDirection.normalize()

      var moveDirection = new Vector3().addVectors(fbDirection, lrDirection)
      moveDirection.normalize()

      var hasMovement = true
      if (moveDirection.lengthSq() < 0.00000001) {
        moveDirection = new Vector3().copy(cameraDirection)
        moveDirection.normalize()

        hasMovement = false
      }

      var hasRotation = playerForward.angleTo(moveDirection) != 0

      if (hasRotation) {
        this.isSyncNeeded = true
      }

      var lerpDirection = new Vector3().lerpVectors(
        playerForward,
        moveDirection,
        0.6
      )
      this.renderableObject.lookAt(
        new Vector3().addVectors(
          this.renderableObject.position,
          new Vector3(lerpDirection.x, 0.0, lerpDirection.z)
        )
      )

      //var quat = new Quaternion().setFromUnitVectors(playerForward, lerpDirection);
      //this.renderableObject.quaternion.multiply(quat);;

      if (hasMovement) {
        var movement = new Vector3(
          moveSpeed * moveDirection.x,
          0.0,
          moveSpeed * moveDirection.z
        )

        // Check and modify movement at first
        movement = this.ValidateMovement(movement, collider)

        if (movement) {
          this.renderableObject.position.x += movement.x
          this.renderableObject.position.z += movement.z

          this.camera.position.x += movement.x
          this.camera.position.z += movement.z
        } else {
          hasMovement = false
        }
      }

      if (hasMovement) {
        this.isSyncNeeded = true
      }

      var playerTarget = new Vector3().addVectors(
        this.renderableObject.position,
        new Vector3(0.0, this.playerHalfHeight, 0.0)
      )

      this.tpsControls.target = playerTarget
      this.camera.lookAt(playerTarget)

      this.tpsControls.update()

      var rt = {
        hasMovement: hasMovement
      }
      return rt
    }
  }

  UpdateFPS(movementStatus, collider, delta) {
    if (this.renderableObject && this.fpsControls && this.enableUpdate) {
      this.forward = movementStatus.x
      this.backward = -movementStatus.y
      this.left = movementStatus.z
      this.right = -movementStatus.w

      var moveSpeed = 5 * delta

      var playerForward = new Vector3()
      this.renderableObject.getWorldDirection(playerForward)
      playerForward.y = 0
      playerForward.normalize()

      var cameraDirection = new Vector3()
      this.camera.getWorldDirection(cameraDirection)
      cameraDirection.y = 0

      var fbDirection = new Vector3().copy(cameraDirection)

      var lrDirection = new Vector3(fbDirection.z, 0.0, -fbDirection.x)

      fbDirection.multiplyScalar(this.forward + this.backward)

      lrDirection.multiplyScalar(this.left + this.right)

      var moveDirection = new Vector3().addVectors(fbDirection, lrDirection)
      moveDirection.normalize()

      var hasMovement = true
      if (moveDirection.lengthSq() < 0.00000001) {
        moveDirection = new Vector3().copy(cameraDirection)
        moveDirection.normalize()

        hasMovement = false
      }

      var hasRotation = playerForward.angleTo(moveDirection) != 0

      if (hasRotation) {
        this.isSyncNeeded = true
      }

      var lerpDirection = new Vector3().lerpVectors(
        playerForward,
        moveDirection,
        0.6
      )
      this.renderableObject.lookAt(
        new Vector3().addVectors(
          this.renderableObject.position,
          new Vector3(lerpDirection.x, 0.0, lerpDirection.z)
        )
      )

      //var quat = new Quaternion().setFromUnitVectors(playerForward, lerpDirection);
      //this.renderableObject.quaternion.multiply(quat);;

      if (hasMovement) {
        var movement = new Vector3(
          moveSpeed * moveDirection.x,
          0.0,
          moveSpeed * moveDirection.z
        )

        // Check and modify movement at first
        movement = this.ValidateMovement(movement, collider)

        if (movement) {
          this.renderableObject.position.x += movement.x
          this.renderableObject.position.z += movement.z

          this.camera.position.x += movement.x
          this.camera.position.z += movement.z
        } else {
          hasMovement = false
        }
      }

      if (hasMovement) {
        this.isSyncNeeded = true
      }

      var playerTarget = new Vector3().addVectors(
        this.renderableObject.position,
        new Vector3(0.0, this.playerHalfHeight + 1, 0.0)
      )

      this.fpsControls.target = playerTarget
      this.camera.lookAt(playerTarget)

      this.fpsControls.update()

      var rt = {
        hasMovement: hasMovement
      }
      return rt
    }
    else if (this.enableUpdate == false) {
      this.fpsControls.update()
    }
  }

  Update(movementStatus, collider, deltaTime) {
    if (this.renderableObject) {
      if (this.tpsControls) {
        return this.UpdateTPS(movementStatus, collider, deltaTime)
      } else if (this.fpsControls) {
        return this.UpdateFPS(movementStatus, collider, deltaTime)
      }
    }
  }

  ValidateMovement(movement, collider) {
    if (movement && collider) {
      // this.playerCapsule = new Mesh(
      // new RoundedBoxGeometry(0.5, 1.7, 0.5, 10, 0.25),
      // new MeshStandardMaterial()
      // );
      // this.playerCapsule.geometry.translate( 0, 0.9, 0 );
      // this.playerCapsule.capsuleInfo = {
      // radius: 0.25,
      // segment: new Line3( new Vector3( 0, 0.27, 0.0 ), new Vector3( 0, 1.4, 0.0 ) )
      // };

      // this.scene.add(this.playerCapsule);

      var capsuleInfo = {
        radius: 0.25,
        segment: new Line3(new Vector3(0, 0.27, 0.0), new Vector3(0, 1.4, 0.0))
      }

      let tempBox = new Box3()
      tempBox.makeEmpty()

      let tempMat = new Matrix4()
      let tempSegment = new Line3()

      let tempVector = new Vector3()
      let tempVector2 = new Vector3()

      tempMat.copy(collider.matrixWorld).invert()

      tempSegment.copy(capsuleInfo.segment)

      // get the position of the capsule in the local space of the collider
      tempSegment.start.x += this.renderableObject.position.x + movement.x
      tempSegment.start.z += this.renderableObject.position.z + movement.z

      tempSegment.end.x += this.renderableObject.position.x + movement.x
      tempSegment.end.z += this.renderableObject.position.z + movement.z

      tempSegment.start.applyMatrix4(tempMat)
      tempSegment.end.applyMatrix4(tempMat)

      // get the axis aligned bounding box of the capsule
      tempBox.expandByPoint(tempSegment.start)
      tempBox.expandByPoint(tempSegment.end)

      tempBox.min.addScalar(-capsuleInfo.radius)
      tempBox.max.addScalar(capsuleInfo.radius)

      collider.geometry.boundsTree.shapecast({
        intersectsBounds: box => box.intersectsBox(tempBox),

        intersectsTriangle: tri => {
          // check if the triangle is intersecting the capsule and adjust the capsule position if it is.
          const triPoint = tempVector
          const capsulePoint = tempVector2

          const distance = tri.closestPointToSegment(
            tempSegment,
            triPoint,
            capsulePoint
          )

          if (distance < capsuleInfo.radius) {
            //const depth = capsuleInfo.radius - distance;
            //const direction = capsulePoint.sub( triPoint ).normalize();

            //tempSegment.start.addScaledVector( direction, depth );
            //tempSegment.end.addScaledVector( direction, depth );

            movement = null

            return null
          }
        }
      })
    }

    return movement
  }
}

class PlayerState {
  constructor(_stateName, _animation, _validPreStates, _overState) {
    this.stateName = _stateName
    this.animation = _animation
    this.validPreStates = _validPreStates
    this.overState = _overState

    this.validPreStateMap = {}

    if (this.validPreStates) {
      for (var i = 0; i < this.validPreStates.length; ++i) {
        this.validPreStateMap[this.validPreStates[i]] = true
      }
    }
  }

  IsConnectedWith(nextState) {
    if (this.validPreStates) {
      return this.validPreStateMap[nextState] == true
    }

    return true
  }
}

class LodPlayer {
  constructor(logicPlayer, playerAsset) {
    this.renderableRoot = new Object3D()
    this.renderableRoot.position.copy(MMOPlayerMgr.GetSpawnPoint())

    this.logicPlayer = logicPlayer

    this.SetupRendererableObject(playerAsset)
  }

  SetupRendererableObject(playerAsset) {
    this.lodObjects = []

    this.activeObject = null

    // LOD 0
    if (playerAsset.raw) {
      var currentAsset = playerAsset.raw

      var rawObject = SkeletonUtilsClone(
        currentAsset.scene ? currentAsset.scene : currentAsset
      )
      this.lodObjects.push(rawObject)
      rawObject.visible = true
    }
    this.activeObject = this.lodObjects[0]
    this.SwitchLodLevel(0)
  }
  GetObject() {
    return this.renderableRoot
  }
  SwitchLodLevel(lodLevel) {
    if (lodLevel < this.lodObjects.length) {
      this.renderableRoot.remove(this.activeObject)
      this.activeObject = this.lodObjects[lodLevel]
      this.renderableRoot.add(this.activeObject)
      //this.activeObject.visible = true;
    }
  }
}

// State based logic player
class LogicPlayer {
  constructor(playerAsset, context) {
    this.lodPlayer = new LodPlayer(this, playerAsset)

    this.SetCamera(context, "FPS")

  }
  SetCamera(_context, _type) {
    this.playerCamera = new PlayerCamera(_context.renderer)
    this.playerCamera.SetCamera(
      this.lodPlayer.GetObject(),
      _context.camera,
      _type
    )
  }
  Update(deltaTime, movement, collider) {
    if (movement && this.playerCamera) {
      var rt = this.playerCamera.Update(movement, collider, deltaTime)
    }
  }
  GetRenderableObject() {
    return this.lodPlayer.GetObject()
  }
}

class MMOPlayer {
  constructor(
    _playerAsset,
    _context
  ) {

    this.context = _context

    this.networkObject = {
      logicObject: null
    }
    this.playerAssets = _playerAsset
    this.CreatePlayer()
  }

  GetLogicPlayer() {
    return this.networkObject.logicObject
  }

  CreatePlayer() {
    var playerAsset = this.playerAssets //.raw;//this.playerAssets[avatarId].lod ? this.playerAssets[avatarId].lod : this.playerAssets[avatarId].raw;
    var context = this.context
    if (playerAsset) {
      this.networkObject.logicObject = new LogicPlayer(
        playerAsset,
        context
      )
    }
  }
  UpdateLogic(deltaTime, movement, collider) {
    if (this.networkObject && this.networkObject.logicObject) {
      this.networkObject.logicObject.Update(deltaTime, movement, collider)
    }
  }

  UpdateMovement(
    deltaTime,
    movement /*x: forward, y: back, z: left, w: right*/,
    collider
  ) {
    this.UpdateLogic(deltaTime, movement, collider)
  }
  GetRenderableObject() {
    if (this.networkObject && this.networkObject.logicObject) {
      return this.networkObject.logicObject.GetRenderableObject()
    }
    return
  }
  EnableRotate(bool) {
    if (
      this.networkObject &&
      this.networkObject.logicObject &&
      this.networkObject.logicObject.playerCamera
    ) {
      this.networkObject.logicObject.playerCamera.fpsControls.enableRotate =
        bool
    }
  }
  GetControls(bool) {
    if (
      this.networkObject &&
      this.networkObject.logicObject &&
      this.networkObject.logicObject.playerCamera
    ) {
      this.networkObject.logicObject.playerCamera.enableUpdate = bool
      return this.networkObject.logicObject.playerCamera.fpsControls
    }
  }
  SetView(pos, tar) {
    if (
      this.networkObject &&
      this.networkObject.logicObject &&
      this.networkObject.logicObject.playerCamera
    ) {
      this.networkObject.logicObject.GetRenderableObject().position.set(pos.x, pos.y, pos.z)
      var lookDir = new Vector3().subVectors(this.networkObject.logicObject.playerCamera.fpsControls.target, new Vector3(tar.x, tar.y, tar.z));
      lookDir.y = -0.5;
      lookDir.normalize();
      lookDir.multiplyScalar(0.01);
      this.context.camera.position.addVectors(
        this.networkObject.logicObject.playerCamera.fpsControls.target,
        lookDir
      )
    }
  }
  lookAtCenter() {
    var lookDir = new Vector3().subVectors(this.networkObject.logicObject.playerCamera.fpsControls.target, new Vector3(0, 0, 0));
    lookDir.y = 0.0;
    lookDir.normalize();
    lookDir.multiplyScalar(0.01);
    this.context.camera.position.addVectors(
      this.networkObject.logicObject.playerCamera.fpsControls.target,
      lookDir
    )
  }

}

export { MMOPlayerMgr, MMOPlayer }
