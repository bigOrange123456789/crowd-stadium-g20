//config.loading；加载数据包
//window.param.projectName: 用于获取config.json的地址
//window.c : 判断视点的位置和相机是否移动
import {
    Frustum,//用于视锥剔除
    Matrix4,//用于视锥剔除
} from '../three/build/three.js';
export {Visibility}
class Visibility{
    //最好再加入遮挡剔除
    constructor(config) {
        var scope=this
        scope.border=false//判断视点是否在场景边缘的标记
        this.loading=config.loading
        scope.list_shell=
        [
            18477,17667,17670,17668,20930,17666,18558,18564,17678,17669,20917,18563,17400,18501,20931,18488,20919,17677,18485,18514,18487,18612,17487,17675,17401,18557,18506,17551,18489,18494,20916,17663,18499,18568,18479,18491,20918,18592,18591,7209,18559,18572,18504,18512,18582,18496,18569,17549,17570,18588,18484,18505,547,18490,18593,17550,20920,18480,18511,18513,18495,17558,18589,18575,18852,18508,18493,7200,12517,17593,18478,18567,20926,17571,18576,18482,7220,20928,18507,18481,19045,3272,12493,12560,20602,17676,18503,18497,18585,18562,18510,18509,2647,20923,12639,18483,18486,12542,12496,20922,12515,17672,7205,18654,18601,18682,17671,18370,18554,18578,20927,20929,20921,17443,12638,12498,12499,18570,18565,18603,12497,2644,12429,18498,18417,4707,12531,18560,12520,17673,17562,17595,20924,18583,17674,12454,18586,17679,18536,4699,18581,12467,20613,18620,12480,12613,19271,12448,12536,17572,18574,2649,18609,18387,19272,20614,12447,12535,18371,20925,2651,20643,18584,12900,1793,18500,18579,18383,7173,12466,6722,17552,2643,7141,12439,19484,17488,7223,2400,12511,6063,12495,12503,17662,2396,12529,12530,18517,3278,12516,3377,12464,2045,2641,18595,12451,17592,18556,18623,18552,12556,3522,12528,12641,12510,18522,12559,15886,18571,12469,12486,12436,18544,17369,17399,12509,18547,12551,17546,3255,12642,20354,12487,7182,12545,18605,12450,7152,9106,12614,4109,17368,3504,12669,18543,1790,12555,7219,7222,1828,13578,12548,12427,542,17484,20867,20787,539,18577,12636,4702,12549,12519,18421,7203,17594,12494,7208,4919,12645,20868,12543,6726,3510,3385,12432,12562,12437,18590,12554,13574,17553,12647,7137,19357,5765,5443,7283,7204,1257,12443,7192,420,17587,17568,19456,3604,20182,2398,18561,17609,17444,20476,4556,2397,545,7143,18903,13770,6681,2394,7138,3266,2395,1666,12650,17330,7199,3786,18523,21275,7739,6806,3280,12541,13077,18540,19671,2390,17489,12489,7188,12424,3718,12505,2318,4362,20183,17554,7170,18555,5084,12680,7154,7146,2661,18683,7172,691,5651,2650,12571,18684,17547,17483,20870,3286,3720,5857,18549,12508,308,8872,19153,18439,13206,20070,18615,12563,170,12825,18537,20698,3514,2669,12553,18526,12717,3433,13210,13214,21161,17394,13219,17370,12492,15885,19672,9001,18657,2667,18060,6020,12534,17569,18573,18348,12445,17623,775,9127,18918,17393,15582,17184,15099,12570,12673,17610,12561,12490,17472,13811,12622,18566,3503,954,9086,7861,13590,5668,12903,18857,7277,18541,2065,5322,21042,17425,17563,3081,12658,15023,12550,17441,21277,3314,5766,18357,5928,890,947,6853,3615,10684,7140,13771,7037,6871,312,18448,311,12504,7326,11551,12456,2670,12425,17574,177,4579,17395,7169,12533,12446,18440,4491,181,12632,313,21169,19046,18611,18539,6723,555,21043,1806,12430,20604,12431,12502,529,3381,3076,3875,12986,18553,5723,3657,18519,18356,18420,18419,8986,6799,18449,4247,15151,3284,2074,13694,18,314,2068,4701,17402,392,20648,12670,12491,416,1327,2044,18516,12449,13813,18528,5323,6919,6120,182,7215,6926,3608,188,19084,13472,7482,5856,6854,4572,13056,20381,5435,5080,18695,17732,15459,5344,7216,6354,20436,3519,10940,414,17560,20869,18075,17460,2666,17446,13794,21302,13081,20890,14688,306,21162,21156,13837,12440,13441,544,3715,3391,4357,5740,4246,528,5260,6635,13566,7805,4912,13156,12633,5645,7276,17471,10943,5656,22,5673,9120,4105,13946,3638,4551,20960,556,8934,5319,17724,17509,3382,3618,17485,18597,13793,17548,2640,18602,3221,18535,12474,3092,527,12475,13858,18904,7159,6721,18856,5665,5859,6060,4168,990,5520,19048,5664,13567,7464,4019,8793,17541,7160,13163,18446,19477,13471,18608,4917,12438,4104,5647,19152,706,17431,6680,17461,10491,18406,15884,7282,724,2067,6725,12473,557,12604,6682,5447,20245,7191,18064,5654,18853,18521,415,7195,13778,12512,12612,20965,2792,18534,9121,9125,18807,13573,3378,3509,2300,18052,20695,2655,2652,21049,17577,3432,18655,13928,17324,13575,12980,4680,4355,6720,168,5860,10808,14257,13545,19827,2391,13570,19673,911,6851,19666,20516,16716,17403,12470,9276,4996,6690,17065,19047,7369,20072,17596,13168,4848,17463,5000,17608,541,9252,14865,7178,12631,316,2051,13974,2061,12674,2325,18395,11191,71,13802,3838,18527,58,18530,18542,20649,7185,20620,18755,20865,7281,18806,3254,13057,13373,17555,18750,17575,12352,11548,3376,17359,12468,2634,2316,3513,21157,17181,6514,3511,18596,3405,12523,18391,3137,7164,12525,18381,17183,3315,546,5640,6491,13522,4128,4359,5828,7134,20866,559,13704,4130,17373,17599,2387,20568,19483,18350,704,17619,7773,5258,566,13812,5095,17607,19635,5646,16728,18598,7232,10560,21254,240,18413,19343,19098,18524,2049,5054,5635,5672,2052,8800,12501,21168,17364,330,7843,6812,2798,18463,21301,5655,17362,7284,14748,10618,12671,2389,7278,59,554,4695,3603,21160,5658,13571,20877,15537,18808,20603,19130,18625,17450,20699,567,17127,17510,18373,2635,13717,7217,15036,3387,463,17329,19266,21065,3309,13444,17578,3128,2245,3100,442,17539,17073,452,21399,3271,3358,3310,3282,5764,5742,4181,4264,4256,4586,5694,13504,4126,4127,5727,6053,14928,6678,7671,303,19497,13703,4205,14149,307,6162,7059,709,7149,5639,19552,6719,7941,12713,19686,16777,12715,562,7487,10978,252,19350,4188,17597,10389,18432,242,1648,20946,15266,6718,17540,21040,7299,7438,12994,20567,5648,19148,21041,2064,17473,13853,20710,5949,7441,13455,9321,20153,17396,12381,67,13807,7032,20488,2133,12575,17474,18407,15002,12428,2819,15415,12582,14562,20181,6026,3431,1794,13589,17378,3836,20875,18629,7197,12795,18624,20605,17112,20872,3781,795,251,17442,17350,336,20709,11758,20712,1326,5659,18665,12476,2246,12626,8047,14365,3501,3507,14371,20615,2664,2663,2629,3101,12558,15042,20616,14150,12540,3398,9200,3647,3512,3228,18599,13576,2642,467,8001,12532,13579,3283,12521,3277,13487,3337,516,450,17077,461,15022,1052,7151,5634,13569,19013,17755,15196,13520,7571,13511,6488,4361,14785,18721,233,14589,4378,7034,15267,15268,14159,5734,4129,19753,13503,13783,18621,3908,19712,7945,5724,5730,4245,15264,12897,4215
        ]
        var list1=Array.from(Array(100)).map((e, i) => this.list_shell[i])
		var list2=Array.from(Array(100)).map((e, i) => this.list_shell[i+100])
		var list3=Array.from(Array(100)).map((e, i) => this.list_shell[i+200])
        setTimeout(()=>{
            scope.loading(list3)
		    scope.loading(list2)
        },200)
		
		this.loading(list1)
        var socketURL="122.224.63.190:38080"//"localhost:8887"
        this.socket=this.initSocket(socketURL)
        window.socket=this.socket
        
        // this.visualList=config.visualList
        // this.groups_arr=config.groups_arr

        scope.areaInf=[
            {
                "min": [
                    1747,
                    -27,
                    -1669
                ],
                "max": [
                    1841,
                    45,
                    -1535
                ],
                "step": [
                    47,
                    36,
                    67
                ],
                "path":"./assets/models/huayirvm0616-0.log/6.ls_d.json",
                "preload":false
            },
            // {
            //     "max": [3080.75, 79.75, -1251.25], 
            //     "min": [1643.25, -32.75, -2638.75], 
            //     "step": [115, 9, 111],
            //     "path":"./assets/models/huayirvm0616-0.log/6.ls_d.json",
            //     "preload":false
            // }
        ]
        //data
        scope.prePoint="";//视点移动就进行加载 (或者添加了新的模型) //window.c.position.x+","+window.c.position.y+","+window.c.position.z
        scope.prePoint2="";//视点移动就进行渲染剔除 (或者添加了新的模型) //window.c.position.x+","+window.c.position.y+","+window.c.position.z

        var s=scope.areaInf[0].step
        console.log((s[0]+1)*(s[1]+1)*(s[2]+1) )
        this.visualList=Array.from(Array( (s[0]+1)*(s[1]+1)*(s[2]+1) )).map((e, i) => false)
        scope.dynamicLoading()//加载和预加载
        scope.start2()//遮挡剔除和视锥剔除
        
        
    }
    initSocket(socketURL){
        var scope=this
        var socket = io.connect(socketURL,{transports:['websocket','xhr-polling','jsonp-polling']})
        socket.on('channel1',  data=> {
            console.log(data)
        })
        socket.on('list',  message=> {
            // console.log(data)
            console.log(
                "socket list"+message.index,
                message.data0["1"].length,
                message.data0["2"].length,
                message.data0["3"].length,
                message.data0["4"].length,
                message.data0["5"].length,
                message.data0["6"].length)
            scope.visualList[parseInt(message.index)]=message.data0
            scope.prePoint=Math.random()//接下来进行加载
        })
        //socket.emit('message', {"test":123})
        return socket
    }
    request(posIndex){
        this.socket.emit(
            'index', 
            posIndex[3]
        )
    }
    dynamicLoading(){//用于加载和预加载
        var scope=this
		var first=true
		setInterval(()=>{
					var point0=window.c.position.x+","+window.c.position.y+","+window.c.position.z
                    if(this.prePoint===point0){//如果视点没有移动
						if(first){//如果是第一次
                            var list_data=this.getList()
                            if(list_data){
                                var directs=scope.getDirect()
                                var list2=[]
                                for(var i=0;i<5;i++){//不进行遮挡判断
                                    var direct=directs[i]+1
                                    var list=list_data[direct]
                                    for(var j=0;j<list.length;j++)
                                        if(!window.meshes[list[j]])
                                            list2.push(list[j])        
                                }
                                if(list2.length>0)
                                    scope.loading(list2)
                            }
							first=false
						}
					}else {//如果视点发生了移动
						scope.prePoint=point0
						first=true
					}
		},200)
		console.log("开始动态加载资源")
    }
    start2(){//用于渲染的遮挡剔除
        var scope=this
        var prePoint2_rot=""
        
		function setInterval0(){
            requestAnimationFrame(setInterval0)
            var point0=window.c.position.x+","+window.c.position.y+","+window.c.position.z
            var point0_rot=window.c.rotation.x+","+window.c.rotation.y+","+window.c.rotation.z
            if(scope.prePoint2!==point0||prePoint2_rot!=point0_rot){//如果视点位置或方向变化就进行剔除
                // scope.cullingFrustum()
                var list_data=scope.getList()
                if(list_data){//如果知道此刻的可见度列表
                    for(var i in window.meshes){
                        window.meshes[i].visible=false
                        // window.meshes[i].Obscured=true//被遮挡，不可见
                    }
                    var directs=scope.getDirect()
                    for(var i=0;i<5;i++){//遮挡剔除
                        var direct=directs[i]+1
                        var list=list_data[direct]
                        for(var j=0;j<list.length;j++){
                            var mesh0=window.meshes[list[j]]
                            if(mesh0)mesh0.visible=true
                        }
                    }
                    var count=0
                    for(var i in window.meshes){
                        if(window.meshes[i].visible)count++
                    }
                    // console.log(count)

                }//if(list_data)
                scope.displayShell()
            }
            scope.prePoint2=point0 
            prePoint2_rot=point0_rot
		}setInterval0()
		console.log("开始进行遮挡剔除")  
    }
    displayShell(){
        if(true){//if(this.border){//始终展示外壳
            for(var i=0;i<this.list_shell.length;i++){
                var index=this.list_shell[i]
                var mesh=window.meshes[index]
                if(mesh)mesh.visible=true
            }
        }
    }
    getDirect(){
        var d=window.c.getWorldDirection()
        var d0={x: 0, y: 0, z: -1}  //  //[0,0,0]
        var d1={x: 0, y: 1, z: 0}   //上//[Math.PI/2,0,0]
        var d2={x: 0, y: 0, z: 1}   //  //[Math.PI,0,0]
        var d3={x: 0, y: -1, z: 0}  //下//[Math.PI*1.5,0,0]
        var d4={x: -1, y: 0, z: 0}  //  //[0,Math.PI/2,0]
        var d5={x: 1, y: 0, z: 0}   //  //[0,-Math.PI/2,0]
        var getMul=(a,b)=>{return a.x*b.x+a.y*b.y+a.z*b.z}
        var angle=[
            getMul(d,d0),getMul(d,d1),getMul(d,d2),getMul(d,d3),getMul(d,d4),getMul(d,d5)
        ]
        var min=0,max=0
        for (var i=1;i<6;i++){
            if(angle[i]>angle[max])max=i
            if(angle[i]<angle[min])min=i
        }

        return selectSort(angle)//{max:max,min:min}
        function selectSort(array) {//>,>,> 降序排序
            var array2=[0,1,2,3,4,5]
            const len = 6//array.length
            let temp
            let minIndex
            for (let i = 0; i < len - 1; i++){ //逐个选出最大
              minIndex = i//
              for (let j = i + 1; j < len; j++) {
                if (array[j] >= array[minIndex]) {
                  minIndex = j//指向最大的元素
                }
              }// for (let j = i + 1; j < len; j++)
              temp = array[i]
              array[i] = array[minIndex]
              array[minIndex] = temp

              temp=array2[i]
              array2[i] = array2[minIndex]
              array2[minIndex] = temp
            }//for (let i = 0; i < len - 1; i++) 
            return array2
        }//function selectSort(array)
    }   
    getList(){
        var posIndex=this.getPosIndex(
            this.areaInf[0].min,
            this.areaInf[0].step,
            this.areaInf[0].max)
        var list=this.visualList[posIndex[3]]
        if(!list)this.request(posIndex)
        return list//[ posIndex ,this.visualList[posIndex[3]] ]
    }
    getPosIndex(min,step,max){
        var min,step,max
        var x=window.c.position.x
        var y=window.c.position.y
        var z=window.c.position.z
        if(x>max[0]||y>max[1]||z>max[2]||x<min[0]||y<min[1]||z<min[2]){
            this.border=true
            if(x>max[0])x=max[0]
            if(y>max[1])y=max[1]
            if(z>max[2])z=max[2]
            if(x<min[0])x=min[0]
            if(y<min[1])y=min[1]
            if(z<min[2])z=min[2]
        }else this.border=false

        
        
        var dl=[]
        for(var i=0;i<3;i++)
            dl.push(
                (max[i]-min[i])/step[i]
            )
        
        var xi=Math.round((x-min[0])/dl[0])
        var yi=Math.round((y-min[1])/dl[1])
        var zi=Math.round((z-min[2])/dl[2])
        window.pos=[
            xi*dl[0]+min[0],
            yi*dl[1]+min[1],
            zi*dl[2]+min[2]
        ]

        var s=step
        var index=xi*(s[1]+1)*(s[2]+1)+yi*(s[2]+1)+zi
        return [xi,yi,zi,index]
    } 
    loadJson(path,cb) {
        var request = new XMLHttpRequest();
        request.open("get", path);//请求方法,路径
        request.send(null);//不发送数据到服务器
        request.onload = function () {//XHR对象获取后
            if (request.status === 200) {//获取成功的状态码
                var str=request.responseText
                cb(JSON.parse(str),path)
            }
        }
    }
    cullingFrustum(){//视锥剔除
        if(!window.meshes)return
        if(!this.cullingFrustumNotFirstFlag){
            this.cullingFrustumNotFirstFlag=true
            return//跳过第一次的视锥剔除
        }//第一次的视锥剔除会出错，出错的原因现在还不清楚//出错原因可能是一帧无法完成全部包围球遮挡判断的计算 //出错的原因可能是初始数据包的解析问题
        
        var frustum = getFrustum(window.c)
        for(let i in window.meshes){//for(let i=0; i<window.meshes.length; i++){
            var m=window.meshes[i]
            if(!m.Obscured)
                m.visible=intersectSpheres(m.bounding_sph, frustum)
        }
        function getFrustum(camera){
            var frustum = new Frustum();
            frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
            return frustum;
        }
        function intersectSpheres(spheres, frustum){
            if(spheres)
            for(let i=0; i<spheres.length; i++)
                if(intersectSphere(spheres[i].center, spheres[i].radius, frustum))
                    return true
            return false
            function intersectSphere(center, radius, frustum) {
                const planes = frustum.planes;
                const negRadius = - radius;
                for(let i=0; i<planes.length; i++){
                    const distance = planes[ i ].distanceToPoint( center );//平面到点的距离，
                    if ( distance < negRadius ) //内正外负
                        return false;//不相交
                }
                return true;//相交
            }
        }
    }
    cullingFrustum1(mesh_id){//用于预加载的视锥剔除判断
        if(!window.meshes)return
        if(!this.bounding_sph)return
        var frustum = getFrustum(window.c)
        var bounding=this.bounding_sph[mesh_id]
        //console.log(frustum)
        //console.log(bounding)
        for(var i=0;i<bounding.c.length;i++){
            if(intersectSphere(bounding.c[i], bounding.r, frustum))
                return true//相交
        }
        return false//不相交

        function getFrustum(camera){
            var frustum = new Frustum();
            frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
            return frustum;
        }
        function intersectSphere(center, radius, frustum) {
            const planes = frustum.planes;
            const negRadius = - radius;
            for(let i=0; i<planes.length; i++){
                const distance = planes[ i ].distanceToPoint( center );//平面到点的距离，
                if ( distance < negRadius ) //内正外负
                    return false;//不相交
            }
            return true;//相交
        }
    }
    cullingFrustum1_2(mesh_id){//用于预加载的视锥剔除判断
        if(!window.meshes)return
        if(!this.bounding_sph)return
        var frustum = getFrustum(window.c)
        var bounding=this.bounding_sph[mesh_id]
        //console.log(frustum)
        //console.log(bounding)
        for(var i=0;i<bounding.c.length;i++){
            if(intersectSphere(bounding.c[i], bounding.r, frustum))
                return true//相交
        }
        return false//不相交

        function getFrustum(camera){
            var frustum = new Frustum();
            frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
            return frustum;
        }
        function intersectSphere(center, radius, frustum) {//上下左右前(远)后(近)
            getSpace(frustum,1,1)
            function getSpace(frustum,a1,a2){
                return [
                    [1,1,1,1],
                    [1,1,1,1],
                    [1,1,1,1],
                    [1,1,1,1],
                    [1,1,1,1],
                    1
                ]
            }

            var position=window.c.position
            if(center.x*position.x+center.y*position.y+center.z*position.z>Math.pow(frustum[4].constant-frustum[5].constant,2))
                return false
            const planes = frustum.planes;
            if ( planes[5].distanceToPoint( center ) < - radius ) //内正外负
                    return false;//不相交
            
            return true;//相交
        }
    }
}
