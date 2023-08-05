class Blur{
    constructor(finish){

        var width=120, height=50;
        var oButton=document.createElement('p');//按钮
        oButton.innerHTML="Join";
        oButton.style.cssText='font-size:20px;'//字体大小
            +'width:120px;height:50px;'//按钮大小
            +'color:white;'//字体颜色
            +'background:#CC2E71;'//按钮颜色
            +'vertical-align:middle;'
            +'text-align:center;'
            +'line-height:50px;'
            +'border-radius: 6px;'
            +'position:fixed;'//到窗体的位置
            +'left:'+(window.innerWidth/2-width/2)+'px;'//到部件左边距离
            +'top:'+(window.innerHeight/2-height/2)+'px;'; //到部件右边 距离
        oButton.style.cursor='hand';
        oButton.onmouseover=function(){
            oButton.style.cursor='hand';
            oButton.style.borderRadius='70px';
            oButton.style.backgroundColor = '#F7819F';
        }
        oButton.onmouseout=function(){
            oButton.style.cursor='normal';
            oButton.style.borderRadius='6px';
            oButton.style.backgroundColor = '#CC2E71';
        }
        oButton.onmousedown = function() {
            document.getElementById("cheat").style.visibility='hidden';
            if(finish)finish()

        }
        oButton.onmouseup = function() {
            oButton.style.backgroundColor = '#F7819F';
            oButton.style.color = 'white';
        }
        document.getElementById("cheat").appendChild(oButton);
    }
}
export{Blur}
