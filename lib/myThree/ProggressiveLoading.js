import {
	Matrix4,
	FileLoader,
	LoadingManager,
	Object3D,
	Mesh,
	InstancedMeshEx,
	BoxGeometry,
	MeshBasicMaterial,
	//FrontSide,BackSide,DoubleSide
  } from '../three/build/three';
import { GLTFLoaderEx } from '../three/examples/jsm/loaders/GLTFLoaderEx.js';
import {ZipLoader } from '../ziploader.js';
import { Visibility } from './Visibility.js';
class ProggressiveLoading{
	constructor(sceneMgr,SLMSceneMeta,SLMConstansts){
		this.sceneMgr = sceneMgr;
		this.SLMConstansts=SLMConstansts
		this.SLMSceneMeta=SLMSceneMeta
		this.start()
	}
	start(){
		var scope=this
		if(window.loadSubZip3_worker0)loadSubZip3_init_double(addModel2)
		else loadSubZip3_init_single(addModel2)
		window.addMoment("ProggressiveLoading.start")
		if(!window.loadedLZC)window.loadedLZC={}
		
		var instanceRoot = new Object3D(); //InstancedMeshEx的父节点 ，和rootGroupNode平级
		instanceRoot.rotation.set(-Math.PI/2,0,0) //x2=x1,y2=z1,z1=-y1//console.log(instanceRoot)
		window.scene.add(instanceRoot);
		var slmSceneMeta = new this.SLMSceneMeta(this.sceneMgr, {geoInfo: null, propInfo: null, elemInfo: null, sceneTag: this.sceneTag, groupInfo: null});
		
		window.meshes={}//用于遮挡剔除
		window.loadedLZC={}
		window.rs=(n)=>{
				var rotations={
					"1":[0,0,0],//下
      				"2":[Math.PI/2,0,0],
      				"3":[Math.PI,0,0],
      				"4":[Math.PI*1.5,0,0],
      				"5":[0,Math.PI/2,0],
      				"6":[0,-Math.PI/2,0]
				}
				var rot=rotations[n+1+""]
				window.c.rotation.set(rot[0],rot[1],rot[2])
		}
		if(window.SamplingOfVisibilityFlag){//如果是可见度采样模式
			instanceRoot.visible=false
			loading(Array.from(Array(21484)).map((e, i) => i))//loading(Array.from(Array(1000)).map((e, i) => i))//
		}else{
			window.c.position.set(1735.0502893140456,  44.40395742941816,  -1630.84507305955)
			window.c.rotation.set( -2.171124432258887,  -1.0036359203411716,  -2.2526354762470935)

			// const cube = new Mesh( 
			// 	new BoxGeometry( 1, 0, 1 ), 
			// 	new MeshBasicMaterial( {color: 0xa878787} )//new MeshBasicMaterial( {color: 0xa08050} )
			// );
			// cube.position.set(1782+590, -5.00001, -1578-360)
			// cube.scale.set(1250,0,1400)
			// window.scene.add(cube)
			
			//loading(Array.from(Array(1000)).map((e, i) => i))
			

			// var list1=Array.from(Array(1052)).map((e, i) => list[i])
			
			
			function test(obj,direct,pos){
				console.log(obj)
				var rotations={
					"1":[0,0,0],//下
      				"2":[Math.PI/2,0,0],
      				"3":[Math.PI,0,0],
      				"4":[Math.PI*1.5,0,0],
      				"5":[0,Math.PI/2,0],
      				"6":[0,-Math.PI/2,0]
				}
				var rot=rotations[direct]
				window.c.position.set(pos[0],pos[1],pos[2])
				window.c.rotation.set(rot[0],rot[1],rot[2])//window.c.rotation.set(0,0,0)//
				var arr=obj[direct]//Object.keys(obj[direct])//Object.keys(obj["2"])//
				for(var i=0;i<arr.length;i++)
					arr[i]=parseInt(arr[i])
				loading(arr)
			}
			
			new Visibility({"loading":loading})
			
			

		}
		
		function loading(meshIndex) {//普通加载
			if(meshIndex.length>0)console.log("loading",meshIndex.length)
			if(window.loadSubZip3_worker0)loadSubZip3_double(meshIndex)//loadSubZip3(addModel2,meshIndex)//双线程
			else loadSubZip3_single(meshIndex)
		}
		// scope.sceneMgr.scenePicker.SetupMaterials();

		function addModel2(m1,meshIndex,matrixConfig,structdesc0){
			if(window.loadSubZip_test){
				if(window.loadSubZip_test.addModel2_first_time===-1){//第一次使用addmodels
					window.loadSubZip_test.addModel2_first_time=
						performance.now()-window.loadSubZip_test.time0
					
				}
				window.loadSubZip_test.addModel2_last_time=
					performance.now()-window.loadSubZip_test.time0
				window.loadSubZip_test.addModel_count++
			}
			var m2=scope.processMesh(
				m1, //mesh
				structdesc0,//实例化的矩阵？
				matrixConfig,
				m1.parent.matrix,//rootGroupNode.matrix,//mesh父节点的矩阵
				slmSceneMeta //处理器？
				,meshIndex
			)	

			instanceRoot.add(m2);
			window.meshes[meshIndex]=m2;
			m1.visible=false
			
			if(window.dynamicLoading)
				window.dynamicLoading.prePoint2=Math.random()//接下来进行遮挡剔除
			// loading(meshIndex+1)
			if(window.SamplingOfVisibilityFlag){//如果是可见度采样模式
				var length=Object.values(window.meshes).length
				if(length==21484){
					console.log("End loading!")
					instanceRoot.visible=true
				}
			}
		}
	}
	processMesh(
			node,  		//mesh
			groupStruct,//将mesh分成多段，每一段是一组
			instanceMatrixMap,
			rootGroupNode_matrix,//mesh父节点的矩阵
			slmSceneMeta//处理器？
			,meshIndex
		){
			var scope=this
			//console.log("rootGroupNode_matrix",rootGroupNode_matrix.elements)
			var groups = [];
			var instanceCountList = [];
			node.material.transparent=false
			if(window.SamplingOfVisibilityFlag){//如果是可见度采样模式
				var clonedMaterial=new MeshBasicMaterial({
					color:meshIndex
				})
				clonedMaterial.color.convertSRGBToLinear();
				clonedMaterial.transparent=false  //不是透明材质  //node.material的材质是透明材质
				clonedMaterial.side=2//双面渲染
			}else{
				var clonedMaterial = node.material.clone()
				var color=clonedMaterial.color.r+clonedMaterial.color.g+clonedMaterial.color.b
				if(color<0.1||color>2.9){
					clonedMaterial.color.r=0.3+0.3*Math.random()
					clonedMaterial.color.g=0.3+0.3*Math.random()
					clonedMaterial.color.b=0.3+0.3*Math.random()
				}
				clonedMaterial.side=0//FrontSide//0//2 //單面渲染
				clonedMaterial.transparent=false  //不是透明材质  //node.material的材质是透明材质
			}
			
			
			var materialList = [clonedMaterial];

			var sceneCofigMeta = {
				id:  null,
				wireframe:  false,
				lighting:  false,
			};
			if (scope.sceneMgr.EnablePicking)
			{
				scope.sceneMgr.scenePicker.SetupInstancedShaderWithVertexColor(clonedMaterial, sceneCofigMeta);
			}
			for (var i = 0; i < groupStruct.length ; ++i)//当前实例组中对象的个数
			{//groupStruct数组的每一个元素由‘i、n、c、s’四个部分构成 //{i: 3278（id无意义）, n: '313350', c: 12, s: 0}
				var groupName = groupStruct[i].n;  //实例化组的name
				// console.log("instanceMatrixMap[groupName]",instanceMatrixMap[groupName])
				if(!instanceMatrixMap[groupName]){
					instanceMatrixMap[groupName]={
						id:[],it:[]
					}
				}else{
					instanceMatrixMap[groupName]={
						id:instanceMatrixMap[groupName][0],
						it:instanceMatrixMap[groupName][1]
					}
				}
				// console.log("instanceMatrixMap[groupName]",instanceMatrixMap[groupName])
				instanceMatrixMap[groupName].it.push([1,0,0,0, 0,1,0,0, 0,0,1,0]);//加上本身
				instanceMatrixMap[groupName].id.push(parseInt(groupName));
				instanceCountList.push(instanceMatrixMap[groupName].id.length);
				var group = {//每一个实例组的参数
					name: groupName,//name 名字，groupName,
					start: 0,//groupStruct[i].s,  // 开始的位置
					count: node.geometry.index.count/3,//groupStruct[i].c,  // 数量
					instanceCount: instanceMatrixMap[groupName].id.length, //示例组中对象的个数
					
					bounds: null,
					oc:false//不知道作用 //oc: groupInfo.ocGroup&&groupInfo.ocGroup[groupName] ? true : false,
				};
				groups.push(group);
			}
		var instancedMesh = new InstancedMeshEx(
			node.geometry, 
			materialList, 
			1, 
			instanceCountList, 
			false//关闭光线？，sceneCofigMeta.lighting
		);
		instancedMesh.geometry.clearGroups();

		for (var groupIndex = 0; groupIndex < groups.length ; ++groupIndex)//每个实例组对应一个对象 //遍历这个mesh对应的实例组
		{
			var group = groups[groupIndex];
			var instanceMatrixList = instanceMatrixMap[group.name].it; //实例组中每个对象的矩阵
			var instancedElemIds = instanceMatrixMap[group.name].id;
			instancedMesh.geometry.addGroupInstanced(group.start * 3, group.count * 3, 0, groupIndex, false);
			for (var i = 0; i < group.instanceCount; i++)
			{
					var mat = instanceMatrixList[i];
					var instanceMatrix = new Matrix4();
					instanceMatrix.set(
								mat[0], mat[1], mat[2], mat[3],
								mat[4], mat[5], mat[6], mat[7], 
								mat[8], mat[9], mat[10], mat[11],
								0, 0, 0, 1);
					instancedMesh.setInstanceMatrixAt(
						groupIndex, 
						i, 
						instanceMatrix.multiply(rootGroupNode_matrix)
					);
					var elementId = instancedElemIds[i];// Instanced element
					instancedMesh.setInstanceColorAt(
						groupIndex, 
						i, 
						scope.sceneMgr.EncodeElementPickingId(//encodedColor
							slmSceneMeta.AddElementWitId(elementId),//elementPickingId, 
							false
						)
					);					
					slmSceneMeta.SetElementDesc(elementId, {mesh: instancedMesh, gId: groupIndex, iId: i, sId: group.name, groupStart: group.start, groupCount: group.count, key: ( null)}, ( null));
					slmSceneMeta.SetElementMatrix(elementId, instanceMatrix.clone());
					slmSceneMeta.SetElementGroupMatrix(elementId, rootGroupNode_matrix.clone());
					//console.log('================= instance node');
			}
			instancedMesh.layers.set(scope.SLMConstansts.SceneLayerMask);
		}
		return instancedMesh
	}
	
}
export { ProggressiveLoading}
function loadJson(url,cb){
	var request = new XMLHttpRequest();
	request.open("get", url);//请求方法,路径
	request.send(null);//不发送数据到服务器
	request.onload = function () {//XHR对象获取后
		if (request.status === 200) {//获取成功的状态码
			var data=JSON.parse(request.responseText)
			cb(data)
		}
	}
}
var loadingManager = new LoadingManager();
function loadZipJson(url,cb){
	new ZipLoader()
		.load( 
				url ,  
				xhr =>{},//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), 'loading...');
				()=>{
					console.log("加载失败:"+url)
					setTimeout(()=>{//重新请求
						loadZipJson(url,cb)
					},1000*(0.5*Math.random()+1))//1~1.5秒后重新加载
				}
			)
		.then( 
				function( zip ){
							loadingManager.setURLModifier( zip.urlResolver );
							parseJson(
								zip.find( /\.(json)$/i )[0],
								cb
							)
					}
			)
	function parseJson(url_json,cb_json){
		var loader = new FileLoader(loadingManager);
		loader.load(
			url_json , 
			data=> cb_json(JSON.parse(data))
		)
	}
	
							
}
function loadSubGLB (back,meshIndex,matrixConfig,structdesc0)
{
	// var projectName=window.param.projectName;
	var url="assets/models/huayi/"+meshIndex+".glb"
	var loader=new LoadingManager()
	new Promise(function( resolve, reject) {
		var myGLTFLoaderEx=new GLTFLoaderEx(loader)
		myGLTFLoaderEx.load(url, (gltf)=>{
			resolve(gltf)
		},()=>{},()=>{
			console.log("加载失败："+meshIndex)
			setTimeout(()=>{
				loadSubGLB(back,meshIndex,matrixConfig,structdesc0)
			},1000*(0.5*Math.random()+1))
		})
	} ).then( function ( gltf ) {
		var m1 = gltf.scene.children[0].children[0]
		//var arr=gltf.scene.children[0].children
		back(m1,meshIndex,matrixConfig,structdesc0)
	} )
}
function loadSubZip (back,meshIndex,matrixConfig,structdesc0)
{//assets\models\SAM_Review_1\output1.zip
	var url="assets/models/huayi/"+meshIndex+".zip"
	var loader=new LoadingManager()
	new Promise( function( resolve, reject ) {
		//加载资源压缩包
		new ZipLoader().load( url,()=>{
		},()=>{
			console.log("加载失败："+meshIndex)
			setTimeout(()=>{//重新请求
				loadSubZip (back,meshIndex,matrixConfig,structdesc0)
			},1000*(0.5*Math.random()+1))//1~1.5秒后重新加载
		}).then( ( zip )=>{//解析压缩包
			loader.setURLModifier( zip.urlResolver );//装载资源
			resolve({//查看文件是否存在？以及路径
				fileUrl: zip.find( /\.(gltf|glb)$/i )
			});
		});
	} ).then( function ( configJson ) {
		var myGLTFLoaderEx=new GLTFLoaderEx(loader)
		myGLTFLoaderEx.load(configJson.fileUrl[0], (gltf) => {
			var m1 = gltf.scene.children[0].children[0]
			back(m1,meshIndex,matrixConfig,structdesc0)
		});

	} );
}
function loadSubZip2 (back,meshIndex){//不要删除这个函数，这个函数可以用于 单线程和多线程的对比测试
	var url="assets/models/huayi/"+meshIndex+".zip"
	var zipLoader=new ZipLoader()
	zipLoader.crossOrigin=true
	zipLoader.load( 
				url ,  
				xhr =>{},//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), 'loading...');
				()=>{
					console.log("加载失败:"+url)
					setTimeout(()=>{//重新请求
						loadSubZip2 (back,meshIndex)
					},1000*(0.5*Math.random()+1))//1~1.5秒后重新加载
				}
			)
		.then( 
				zip=>{	
					var loadingManager = new LoadingManager();
					loadingManager.setURLModifier( zip.urlResolver );
					var loader = new FileLoader(loadingManager);
					loader.load(
						zip.find( /\.(json)$/i )[0] , 
						data0=>{
							var data=JSON.parse(data0)
							var matrixConfig=data.matrixConfig
							var structdesc0=data.structdesc0
							// console.log(data)

							var loader=new LoadingManager()
							loader.setURLModifier( zip.urlResolver );//装载资源
							var myGLTFLoaderEx=new GLTFLoaderEx(loader)
							myGLTFLoaderEx.load(zip.find( /\.(glb)$/i )[0], (gltf) => {
								var m1 = gltf.scene.children[0].children[0]
								// console.log(m1)
								back(m1,meshIndex,matrixConfig,structdesc0)
							});

						}
					)

				}
		)					
}
import {CrossDomain} from '../myWorker/CrossDomain.js';
import {RequestOrderManager} from '../myWorker/RequestOrderManager.js';
function loadSubZip3_init_double (back){
	console.log("双线程")
	if(window.loadSubZip3_worker0)window.loadSubZip3_worker=window.loadSubZip3_worker0
	else window.loadSubZip3_worker=new Worker("../myWorker/loadSubZip.js")
	window.loadSubZip3_worker.onmessage=ev=>{
		var matrixConfig=ev.data.matrixConfig
		var structdesc0=ev.data.structdesc0
		var meshIndex=ev.data.meshIndex
		const manager = new LoadingManager();
		var loader=new GLTFLoaderEx(manager)
		loader.parse( 
			ev.data.myArray, 
			"./",
			gltf=>{
				var m1 = gltf.scene.children[0].children[0]
				back(m1,meshIndex,matrixConfig,structdesc0)
		})
	}
	window.loadSubZip3_worker.postMessage({//开始请求
		type:"start"
	})
}
function loadSubZip3_double (list){
	window.loadSubZip3_worker.postMessage({//开始请求
		type:"list",
		list:list
	})
}
function loadSubZip3_init_single (back){//单线程
	console.log("单线程")
	var crossDomain=new CrossDomain()
	var requestOrderManager=new RequestOrderManager({
  		loaded:[],
  		stackSize:10000,
  		waitNumberMax:100,//150,
  		crossDomain:crossDomain
	})
	setTimeout(()=>{
  		requestOrderManager.waitNumberMax=300
	},500)
	// requestOrderManager.addDemand(
	// 	Array.from(Array(1000)).map((e, i) => i)
	// )
	window.requestOrderManager=requestOrderManager

	window.loadSubZip3_worker_onmessage=opt=>{
		var matrixConfig=opt.matrixConfig
		var structdesc0=opt.structdesc0
		var meshIndex=opt.meshIndex
		// const manager = new LoadingManager();
		// var loader=new GLTFLoaderEx(manager)
		// loader.parse( 
		// 	opt.myArray, 
		// 	"./",
		// 	gltf=>{
		// 		var m1 = gltf.scene.children[0].children[0]
		// 		back(m1,meshIndex,matrixConfig,structdesc0)
		// })
		var m1 = opt.glb.scene.children[0].children[0]
		// console.log(m1)
		back(m1,meshIndex,matrixConfig,structdesc0)
	}
}
function loadSubZip3_single (list){//单线程
	window.requestOrderManager.addDemand(list)
}
// loadSubZip3 (()=>{},10)