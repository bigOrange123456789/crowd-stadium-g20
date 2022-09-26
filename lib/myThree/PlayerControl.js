import {Vector3} from '../three/build/three.js';
import {Spherical} from '../three/build/three.js';
import { Object3D } from '../three/build/three.module.js';
class PlayerControl{
    constructor(camera,center){
        this.mode=1//0是第一人称控制方式(相机中心) 1是场景中心控制方式(物体中心)
        this.speed={
            moveBoard:0.05,//键盘控制下的视角移动速度(物体中心)
            moveDrag:0.01,//鼠标拖拽下的视角移动速度(物体中心)
            moveWheel0:0.001,//鼠标滚轮滚动下的视角移动速度(相机中心)
            moveWheel1:0.03,//鼠标滚轮滚动下的视角移动速度(物体中心)
            movePhone0:0.01,//手机双指下的前进后退速度(相机中心)
            movePhone1:0.05,//手机双指下的前进后退速度(物体中心)
            rotateMouse:0.08,//鼠标拖拽下的旋转速度
            rotatePhone:0.04//手机滑动下的旋转速度
        }

        document.oncontextmenu = ()=>{return false}//关闭鼠标右键弹窗
        var controller=new PlayerControl0(camera,this.speed,center);
        var scope=this
        function tool(){
            requestAnimationFrame(tool);
            controller.mode=scope.mode
            controller.update();
        }tool();
    }
}
class PlayerControl0{
    constructor(camera,speed,center){
        this.speed=speed
        this.constraint=true
        this.camera=camera;
        this.center=center
        this.mode=1//0是第一人称控制方式(相机中心) 1是场景中心控制方式(物体中心)
        this.operating = true

        this.onceClicked=false;
        this.dposition={
            left:0,
            forward:0,
            up:0
        }
        this.ableRotation=true;
        var scope=this
        //设置鼠标控制
        var myMouseManager=new MouseManager();
        myMouseManager.dragMouse=function (dx,dy) {
            scope.onceClicked=true;
            if(!scope.ableRotation||!scope.operating)return;
            if(myMouseManager.button===0){//左键拖动
                scope.rotation1(-scope.speed.moveDrag*dx);
                scope.rotation2(-scope.speed.moveDrag*dy);
            }else{//滚轮或右键拖动
                scope.move(0, scope.speed.moveDrag * dy, scope.speed.moveDrag * dx)
            }
        }
        myMouseManager.onMouseWheel=function(event){
            var delta = 0;
            if ( event.wheelDelta !== undefined )delta = event.wheelDelta;
            else if ( event.detail !== undefined )delta = - event.detail;
            scope.move(
                (scope.mode===1?scope.speed.moveWheel1:scope.speed.moveWheel0) 
                *delta,0,0)
        }
        //设置键盘控制
        var myKeyboardManager=new KeyboardManager();
        myMouseManager.init();
        var autoPath=[];
        myKeyboardManager.onKeyDown=function(event){
            if(event.key==="ArrowUp"||event.key==="w"||event.key==="W")scope.dposition.forward=1;//forward(step);
            else if(event.key==="ArrowDown"||event.key==="s"||event.key==="S")scope.dposition.forward=-1;//forward(-step);
            else if(event.key==="q"||event.key==="Q")scope.dposition.up=1;
            else if(event.key==="e"||event.key==="E")scope.dposition.up=-1;
            else if(event.key==="ArrowLeft"||event.key==="a"||event.key==="A")scope.dposition.left=1;
            else if(event.key==="ArrowRight"||event.key==="d"||event.key==="D")scope.dposition.left=-1;
            else if(event.key==="v"){
                var a=Math.floor(scope.camera.rotation.x*100000)/100000;
                var b=Math.floor(scope.camera.rotation.y*100000)/100000;
                var c=Math.floor(scope.camera.rotation.z*100000)/100000;
                var s="["+
                Math.floor(scope.camera.position.x*100)/100+","+
                Math.floor(scope.camera.position.y*100)/100+","+
                Math.floor(scope.camera.position.z*100)/100+","+
                a+","+
                b+","+
                c+",100]"
                console.log(","+s);
                autoPath.push(s);
            }else if(event.key==="V")alert(autoPath);

        }
        myKeyboardManager.onKeyUp=function(event){
            if(event.key==="ArrowUp"||event.key==="w"||event.key==="W")        scope.dposition.forward=0;//forward(step);
            else if(event.key==="ArrowDown"||event.key==="s"||event.key==="S") scope.dposition.forward=0;//forward(-step);
            else if(event.key==="q"||event.key==="Q")         scope.dposition.up=0;
            else if(event.key==="e"||event.key==="E")         scope.dposition.up=0;
            else if(event.key==="ArrowLeft"||event.key==="a"||event.key==="A") scope.dposition.left=0;
            else if(event.key==="ArrowRight"||event.key==="d"||event.key==="D")scope.dposition.left=0;
        }
        myKeyboardManager.init();

        //设置手机控制
        var myPhoneManager=new PhoneManager();
        myPhoneManager.drag=function(dx,dy){
            if(scope.operating){
                if(!scope.ableRotation)return;
                scope.rotation1(-scope.speed.rotatePhone*dx,scope.camera);
                scope.rotation2(-scope.speed.rotatePhone*dy,scope.camera);
            }
        }
        myPhoneManager.dragDouble=function(distanceChange){
            if(scope.operating)
                //scope.forward(distanceChange*scope.speed.movePhone,scope.camera)
                scope.move(
                    (scope.mode===1?scope.speed.movePhone1:scope.speed.movePhone0) 
                    *distanceChange,0,0)
        }
        myPhoneManager.init();
    }
    update() {//用于协助完成键盘移动控制
        if(this.mode==0){//只在物体中心时执行
            var s=this.speed.moveBoard
            this.move(this.dposition.forward*s,this.dposition.up*s,this.dposition.left*s)
        }
    }
    rotation1(step){//偏航角
        if(this.mode===0){
            var direction0=this.camera.getWorldDirection();
            var direction = new Vector3(//up方向
                0,1,0
            );
            var pos=this.camera.position;
            direction0.applyAxisAngle(direction,step);
            this.camera.lookAt(pos.x+direction0.x,
                pos.y+direction0.y,
                pos.z+direction0.z);
            this.camera.updateMatrix();
        }else{
            var pos0=this.camera.position.clone().sub(this.center)
			var spheric=new Spherical().setFromCartesianCoords(pos0.x,pos0.y,pos0.z)
			spheric.theta+=(step*0.1)
			var pos1=new Vector3().setFromSpherical( spheric )
			this.camera.position.copy(pos1.add(this.center))
			this.camera.lookAt(this.center)
        }
    }
    rotation2(step){//俯仰角
        if(this.mode===0){
            var direction1=this.camera.getWorldDirection();
            var direction2 = new Vector3(//up方向
                0,1,0
            );
            var direction= new Vector3();
            direction=direction.crossVectors(direction1,direction2);
            var pos=this.camera.position;
            direction1.applyAxisAngle(direction,step);
            this.camera.lookAt(
                pos.x+direction1.x,
                pos.y+direction1.y,
                pos.z+direction1.z);
            this.camera.updateMatrix();
        }else{
            var pos0=this.camera.position.clone().sub(this.center)
			var spheric=new Spherical().setFromCartesianCoords(pos0.x,pos0.y,pos0.z)
			spheric.phi+=(step*0.1)
            spheric.makeSafe()
			var pos1=new Vector3().setFromSpherical( spheric )
			this.camera.position.copy(pos1.add(this.center))
			this.camera.lookAt(this.center)
        }
        
    }
    move(x,y,z){
        var scope=this
        if(this.constraint){//受到约束
            if(this.mode===1){//1是场景中心控制方式(物体中心)
                forward(x);
            }else{//0是第一人称控制方式(相机中心)
                up_constraint(y)
                left_constraint(z)   
                forward_constraint(x)
            }
        }else{//不受约束
            if(this.mode===1){//1是场景中心控制方式(物体中心)
                forward(x)
                //开始移动视点中心?
                var obj=new Object3D()
                obj.position.copy(this.center)
                up(y)
                up(y,obj)
                var pos0=this.camera.position.clone().sub(this.center)
                var spheric=new Spherical().setFromCartesianCoords(pos0.x,pos0.y,pos0.z)
                
                if(spheric.theta>-Math.PI/2&&spheric.theta<Math.PI/2){
                    left(z,obj)
                    left(z)
                }else{
                    left(-z,obj)
                    left(-z)
                }
                this.center.copy(obj.position)
                this.camera.lookAt(this.center)
                //完成移动视点中心
            }else{//0是第一人称控制方式(相机中心)
                up(y)
                left(z)  
                forward(x)
            }
        }

        function up(step,obj) {//向上运动
            if(!step)return
            if(typeof(obj)=="undefined")obj=scope.camera
            var direction =  new Vector3(//相机的上方向是（0，1，0）
                obj.matrixWorld.elements[4]
                ,obj.matrixWorld.elements[5]
                ,obj.matrixWorld.elements[6]
            )
            obj.position.add(new Vector3().addScaledVector(direction,step))
        }
        function forward(step,obj) {//向前运动
            if(!step)return
            if(typeof(obj)=="undefined")obj=scope.camera
            var direction =  new Vector3(//相机的初始方向是（0，0，-1）//对y旋转-90度后相机为水平方向camera.rotation.set(0,-Math.PI/2,0);
                obj.matrixWorld.elements[8]
                ,obj.matrixWorld.elements[9]
                ,obj.matrixWorld.elements[10])
            obj.position.add(new Vector3().addScaledVector(direction,-step))
        }
        function left(step,obj) {//向左运动
            if(!step)return
            if(typeof(obj)=="undefined")obj=scope.camera
            var direction =  new Vector3(//相机的左方向是（-1，0，0）
                obj.matrixWorld.elements[0]
                ,obj.matrixWorld.elements[1]
                ,obj.matrixWorld.elements[2])
            obj.position.add(new Vector3().addScaledVector(direction,-step))
        }
        function up_constraint(step,obj) {//向上运动
            if(!step)return
            if(typeof(obj)=="undefined")obj=scope.camera
            var direction =  new Vector3(0,step,0)//相机的上方向是（0，1，0）
            obj.position.add(direction)
        }
        function left_constraint(step,obj) {
            if(!step)return
            if(typeof(obj)=="undefined")obj=scope.camera
            var direction =  new Vector3(//相机的左方向是（-1，0，0）
                obj.matrixWorld.elements[0],0,obj.matrixWorld.elements[2]
            )
            obj.position.add(new Vector3().addScaledVector(direction,-step))
        }
        function forward_constraint(step,obj) {
            if(!step)return
            if(typeof(obj)=="undefined")obj=scope.camera
            var direction =  new Vector3(//相机的初始方向是（0，0，-1）//对y旋转-90度后相机为水平方向camera.rotation.set(0,-Math.PI/2,0);
                obj.matrixWorld.elements[8],0,obj.matrixWorld.elements[10]
            )
            obj.position.add(new Vector3().addScaledVector(direction,-step))
        }
    }
}
function MouseManager(){
    var scope=this;
    this.press=false;//鼠标未处于按下状态
    this.preX=-1;
    this.preY=-1;
    this.button=0//0左 1中 2右
    this.dragMouse=function(dx,dy){
        console.log(dx,dy);
    }
    this.onMouseMove=function( event ) {//鼠标移动事件监听
        if(scope.press&&scope.preX!==-1&&scope.preY!==-1)
            scope.dragMouse(event.x-scope.preX,event.y-scope.preY);
        scope.preX=event.x;
        scope.preY=event.y;
    }
    this.onMouseUp=function( event ) {//鼠标移动事件监听
        scope.press=false;
        //console.log(1);
    }
    this.onMouseDown=function( event ) {//鼠标移动事件监听
        scope.press=true
        scope.button=event.button
        if(window.myMoveManager)
            window.myMoveManager.stopFlag=true
        //console.log(2);
    }
    this.onMouseWheel=function(event){
        console.log(event);
    }
    this.init=function() {
        document.addEventListener( 'mousemove',scope.onMouseMove, true );
        document.addEventListener( 'mouseup', scope.onMouseUp, true );
        document.addEventListener( 'mousedown',scope.onMouseDown, true );
        document.addEventListener( 'mousewheel', scope.onMouseWheel, false );
    }
}
function KeyboardManager(){
    var scope=this;
    this.onKeyDown=function(event){
        console.log(event);
    }
    this.onKeyUp=function(event){
        console.log(event);
    }
    this.init=function(){
        window.addEventListener( 'keydown',scope.onKeyDown, false );
        window.addEventListener( 'keyup',scope.onKeyUp  , false );
    }
}
function PhoneManager(){
    var scope=this;
    this.preX=-1;
    this.preY=-1;
    this.preDistance=-1;
    this.drag=function(dx,dy){
        console.log(dx,dy);
    }
    this.dragDouble=function(distanceChange){
        console.log(distanceChange);
    }
    this.onTouchMove = function (event) {
        //event.touches.length//同时出现的触摸点个数
        if(event.touches.length===1){
            if(scope.preX>=0&&scope.preY>=0)
                scope.drag(
                    event.touches[ 0 ].pageX-scope.preX,
                    event.touches[ 0 ].pageY-scope.preY
                );
            scope.preX=event.touches[ 0 ].pageX;
            scope.preY=event.touches[ 0 ].pageY;
        }else if(event.touches.length===2){
            var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
            var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
            var distance = Math.sqrt( dx * dx + dy * dy );
            if(scope.preDistance>=0)
                scope.dragDouble(distance-scope.preDistance);
            scope.preDistance=distance;
        }
    }
    this.onTouchEnd=function () {
        scope.preX=-1;
        scope.preY=-1;
        scope.preDistance=-1;
    }
    this.init=function(){
        document.addEventListener( 'touchmove', scope.onTouchMove, false );
        document.addEventListener( 'touchend', scope.onTouchEnd, false );
    }
}
export{PlayerControl}
