import * as THREE from "three";
import { GLTFLoader } from "../lib/GLTFLoaderEx";
import { InstancedGroup } from "../lib/instancedLib/InstancedGroup.js";
import { LODController } from "./LODController.js";

class AvatarManager {
    constructor(seats, camera) {
      this.avatar = new THREE.Object3D();
  
      const positionBias = [1.5, 1.1, 0.0]; // 微调人物位置
      this.seatPositions = seats.map((x) => vecAdd(x, positionBias));
      this.seats = seats;
  
      this.camera = camera;
      this.clock = new THREE.Clock();
      this.lodController = new LODController(this.seatPositions, camera);
      this.lodFinished = [false, false, false,false];
      this.filePath;
  
      this.manager = {
        params: [],
        config: {
          // 3级LOD
          animationFrameCount: 20,
          male: {
            // 男性模型
            maxCount: [100, 700,7000, 7000], // 每级LOD的instance数量
            textureCount: [5, 9], // 材质贴图数量 [row, col]
            animationCount: 8,
            body: {
              // body
              head: [0.5322, 0.70654296875, 1, 1],
              hand: [0.20703125, 0.41259765625, 0.7275390625, 0.57958984375],
              bottom: [0, 0.6, 0.5322, 1],
            },
          },
          female: {
            maxCount: [100, 700,7000, 7000],
            textureCount: [5, 8],
            animationCount: 8,
            body: {
              // body
              head: [0.5322, 0.70654296875, 1, 1],
              hand: [0.20703125, 0.41259765625, 0.7275390625, 0.57958984375],
              bottom: [0, 0.6, 0.5322, 1],
            },
          },
        },
        instanceGroup: {
          male: new Array(4), // 4级LOD
          female: new Array(4),
        }
      };
  
      function vecAdd(a, b) {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
      }
    }
  
    async init() {
      // this.psnr = await this.loadJSON("assets/crowd/PSNR.json"); // 峰值信噪比
      await this.initFilePath();
      this.initAvatarParams();
      // this.adjustParam();
      // this.computeDisp();
    }
  
    async initFilePath() {
      // var instanceGroup0=new InstancedGroup()
      // var textureData_male  =await instanceGroup0.loadTexture("assets/crowd/texture/maleTextureLow.webp")
      // var textureData_female=await instanceGroup0.loadTexture("assets/crowd/texture/femaleTextureLow.webp")
      // console.log("textureData_male",textureData_male)
      // textureData_male.flipY = false;
      // textureData_female.flipY = false;
      // var textureData_male=textureData_female
      function myGetTexture(imgbase64,w,h) {
            return new Promise((resolve, reject)=> {
                var img = new Image();
			        img.src = imgbase64;
              var canvas=document.createElement("canvas")
			        canvas.width=w;
              canvas.height=h;
              img.onload = () => {
                canvas.getContext('2d').drawImage(img, 0, 0,w,h);
                var texture=new THREE.CanvasTexture(canvas);
                texture.flipY=false;
                resolve(texture);
			        };
            });
        }
      var textureData_male=await myGetTexture(
        "data:image/jpeg;base64,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",
        104,78     
      )
      var textureData_female=await myGetTexture(
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMAAwICAgICAwICAgMDAwMEBgQEBAQECAYGBQYJCAoKCQgJCQoMDwwKCw4LCQkNEQ0ODxAQERAKDBITEhATDxAQEP/bAEMBAwMDBAMECAQECBALCQsQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEP/AABEIAE4AaAMBIgACEQEDEQH/xAAdAAACAgMBAQEAAAAAAAAAAAAGBwUIAAMEAgEJ/8QANRAAAQMDBAEDAwMDBAEFAAAAAQIDBAUGEQAHEiExE0FRFCJhCBVxMlKRI0KBoRYXJWLR8f/EABoBAAMBAQEBAAAAAAAAAAAAAAMEBQYCAQD/xAAvEQACAQMDAQYFBQEBAAAAAAABAgMABBESITEFE0FRYXGBFDKRsfEGIiPB0eFC/9oADAMBAAIRAxEAPwAuqEOh3dVW63eNKp9VnRzzYkzY6HXWcHKQhSgSkJOSkDpJJwBk5Xv6jfXjWFSH6PLfZlrrjSGVsqAWOTL6cJJ8E5Iz15PzpjPRWBAbdjuureccKCOYIH/HX/Z0rv1Jtpg2ZRmUvraQ1VWilaUhvC/SdIwQSBgA4A/zqBHORKq53NXRbBrcyKDtSZkbVXbb9LVUalar0JlHFTj5KSR+VEEn8aFn7GuO5bnm0egUw1FxlLUhbTC0KwFIRglWfHYHnrxo6tynbk7kSVUuHdMh+lNuBMt6pVdXoMJ48gooUrKyfA4gn/jOhG7qZcli3pWYdtXPUFvRw0k1KkrdjpdCmkq4gpOcJyARnyknVm3leRigxnHfnFTL5V7JZFB05weM1yr20uGnVB6l3BDZpLyITs5LEtwI9ZpAVkI455KPEgJ9z1151O0rai7q1FFxQ7PVKTKSFNSkIbTyT4GAMY8EeNGtv/p53JvWALpvi83Iqno+WFzJCpry0KSFcivnhCME98uQKT0POuq49o9w7Xt5qLY+59VrsgKQy1SY1TeAWlRweKVOcUgZJ+O9CuepRKANQ1D1x7V9a9DmDHIIQ8bjPvSIvOg3AKzZ1OtpUedOrz0uKuG1xXISlCmeQVyT/p5ByClWTxPxplK2uuC3URxOoRo8V59LZkOrQE+oegVqSSfyT376NGv0sT48inVa571gwKowhbjRaDrbjCiE8il4OJUs+AohKcfnOtLWwO49evJxhO5lXqtEjRgtbkyoOy4yXFHttDKnCpSgBy7IH50tJfo2CrZp6LpbxqUZd+7cU0qXstalJp1vSfo49WdQht1ZecEiMhSkhS3WMpBwpZ5A/B8a131JtOl0epTNwq60xSmH4zyxIUpRSUutqaJAycBwIx17d680xxmgwk0KReUsSKTwipR9d6A5NEJwW8kAfbjic48Z1Hb52Y/cW31SuGSnnDIipfisNIdYVh9sZKhyGckKPyQfnUXs2mulcseR967uLFXQzRL8uMju2qWtVFmQradum347CY0sBUSaU4VJbeUFZyoApSVLPWAPxjVf96ajd9S3woO3Vq0thUKp0lp6dCbYaJUQ+/zUSoAAgISf+x51H2jt/ctSr9GplgUQqDLzT6g8gmPGCXuaXF4GQnl3gDOckd6b16WpTqdeUau3fNgi4kQW8TKb6sFbSCtwFKFB0qAzyyoEA58edaKV1hfs23Ph3UV7kXFoRp0jjalJVttZ9ry2hPoceiKqKygPOJaSHVDzyKBnrrvvzrNPdrZ21r7tqFV63d9clvlIKFfuSn+wpY79Uq9vjHnWaPD12PTiRipHcBtUSTosmcxKGHizb02aZApdHWtxiI02lf8AqOBZJBP93Z/nv/61Wv8AXE9na+kqotWDsiRc8VtKELGUhcaQQQr27wM/B0WO0ramjRpFW21vqnSbqUhQpzSa+07676v6GglS8KySMAn40Eb8wLrptlUaqbpVZDzEitMoeiQ4zSFR3TFfXwKkEhWCkp5JOD1561nLVRHKM81rr1mkiKnupvU3bHb2g7c0ym1mkW9QZ7VOZE2qiJF+oaf9BPqrDqkkKOeRz31rss7bfbFdKhz6QI9wwlPrkNy3lJcZkuDkgqLaAllRSMoyEZwn3PekPsZZVMv6rT5VBlyl/tjQ5My3ipv/AFEFKeUZSi26kpKu1IV4GCPewdK27o9Mp6KZKmpjymUqQluLHZjobyonKW20BKD35T75PZOT7MxjJUsfWvbdFn0yFV49/wCqNE0Sj3JCmUQoh/trrRhSYkclALakBKmgEdpyk+xBHLOvNt7e7b7fpflUi26fCUCt5Ut9PqONKUkAqDrhKkDiPYgf5OVNRU3/ABg/MvHdqlUulIlLafhufQlf0KVkKW4/3wy1yyc8gBknOtd5zKBSKApf6f8AcWiS7qW4htDH75AdDyCR6pUl9fBWEnJz7aDkTKscbE0zNpgHaMBj1APt+aOLro+3901kU995M6ZSkKZlo9VbfptP8FFB44C0r9MZBKgeHY+W9bT+28KSulWzQqLSnHmlPKaiwW2PUQgDl/SEj/cAD+fzqoT+3SyFzrx33hrq9TR9TPfp/ooRlAwRhDiMpTzA5HH8DOpSzk3miqOwrN3gpRoMCIlK5jiIsp591avubI5lTfSQQpXXx7nVITfDP82od+RuKmiO3uANA0nyI58+fvQxuL+nm96xuHc1fi0eNLplQrM6ZBDs1C20tuvrcCkoWcJyFAnAH5192VoiaDvnRrWupuOuMhMwTIiHg60oLhudEIOFDKgCPHWCOtTkm1GzW37tX+ophchhx2RIhfVISy2pHTqVEP8ABISvkkjjhJGOvGts236TeSpe4KdxKDS/3FgR3qvFnsviOoAIJQ8hQQlRICTwOTzIz5BWaT+TUGJ9jVmzvojEbaaNVB2yMZ8M7d9W+oFx7bW/BjUelwY0MchFZQiOEgKUrihIPt2QAP8AGlZ+o3a+m3TuFArJpyVmPS2GSPqC22v05DyxyQDxWMqz2D50jrVgXZQpzcDaze+Bd05+QlySt6VHkfQtJwQ6UOOrJSFAdJBOfjRTdMOu1BwPbj77swas2ynmC43FSG1HDeEJWgBJUlYBIySCPbAM3Um3j5PpipV90qNvkJKeuPvW2Rb7FvBtgfQQ2Qc+kypIAySf6QBjJ/HtrNd8CXQpVFp71RvWjVCAyotR5pnM8Ji0/wBWFkqB4+6e/Os1wLpj/wCM1nrjoTF/4nAHmakKZtbt1SVhyLbzLZHHy+6rpIPEYKvbJx/zqCXaVoXpU5Nu151FYpMJRfi012IpLTSgeKXEuZ+/CVqGDnPPPsNBVBtWkUKvUZ6ReFstS1Ox5UdH7mhK5CTywUcj94X3jGQcdant/f2+2aJCr9xV6SIEuooZaZXGQttDimnVD7mGvUUQEkZJ449s40QiKCQQCUtq4P53q3HK08Zlki0Y7jj+qdFsNUmjNwKBT4sWHHHpx47CEJRlCE4SgEjvCQTk5Pk6SlKauC4/1VbgUuu1uUu17Zbp4TQAEhl5UiC0Qout8VJwtXPrOfB0I7W1Su3HV3//AE1v+HSKRE9JdSeVFV6wWR9nBL6U5yMgkHAz7nGiy4to7zua45lVi11uqqntIfS9IdWX3m0oS1zUGm+OErQUgp8ccE5zruMRYe3lbI8SMilLrtAUnhjJ8gcH6/5UjuzQrLkyBTqfTWYUR2C63JjoWt311q/2KyrKSpKvnwc40taDMsyxYEqFDpyY6X3C2r0gXFBRx5VkkDoedMe+9p6VTdpq9T2LanMVr9llAJE1x1yav6ZQTxaH9ysjjjJ69zqoMPand+nzo8iFYt1UR9BUES5VMkQ0DI+5JdcSlOfxnJ0f9MA9MMxiVQGII/aPDw2H0pD9URjrSxLcFv2qdtW3O25yfqKtlRqLTqo003ALcl6Q3wJPZBI7B/6/xr7WbYdhNtN1xuNDi+RwfQQs56+3OcdjXN+lJ9VuLuVreK4IpCmYr8T94dZbAQ16vrLQCclKebfJRPXJPjOurc9Ea/NxmzaV7U4WaiKhbr1ICZh9VGStCS2hYBPROVDHx40Tqj/FXTTAEZxyMdwFL9Ht/g7VbaQ5I79WRuc80pf06tXJX9ytw23CupUihVKVFpzDriCiKXJTilekhZAAISCceTjT7pVuW9WZ/wC2VRllwtSFBUcFBAcRhaSCk5ykgHrwQdV4qdi1eXXquxT6DWpUBM0qMj6R4qMdSiUOrKUjpTf3A4AIJI86YtNsHaNq2GLMpG5L9JilakLjNSiUF0vcgSt5JJJOOgoDJAGfdW+jZQpU8+FcxdPgmukm1aSrDJZtsA74FPZuj25RaPMpzceNBgyQ4HsEIyXD9/3HsFWSc59ydB1t2ttBV45qVoRKS9EaKWXFQJfNr1EAKAdSk8CtPJKsKBIyM6X1K23qsCamgbN7mN1J+Q8qPWg6uLJXGieHCWs8shXWBj4JGpZH6b6Wy8xT367VA+tnikMxGkhxSQSVJQBnwfyQPfUmKMtJlmx963k80axt2f7ht4AHz5P2o53CRYEiXRG7xrUSmsQ1qSwyt9tltRKD0pKhjA45HgdazU8dtrPmWNS6LU6NOqdQgggKkLca9MknK8JAzkYHxrNMxydkNJ1e1R5lWZtShfrW2lUOlWm8ZkKkR6aqQlKFqQyGi4BniDgd4ycfydRV5ItOuW2xEuNujz4xlpdaanttL4q4LwQlY6PFRx+M/nUZdsSnSrdfptAuiFEqqCoRXZVTPpsSR8p5K4lOexxyM+NLSs3NEtyFHgVmvStyKq1JS3LprMlLLDBCVcnm1FGCEnCB32HPA1JisrqeSMyruDuQDkDyzx71UuLiJImIZff/AAU1a5LspG3yqLJmx49KZabbT9AEcWkADASEggdD48aHGLks+hx4lMoVWVIpyVFyPhaeagDzX0eJxz5e3n+M6FLFuKn7hKqsONRo1lxW0JTJYnSObj3JOUqQgpSMDHZPz76Ervrm39t3fUqE9XBJVFDaErAUsBRjpcAy2AgH7s/aPfvvOtPYRCQtAXI798Y/NZ/qFz8twqBu7bOfxTfevujuU2pVGG7MiurCG2kLAaXzKD9/v4yD1qNpUGRWKSKoxPiSWQhQJU9laADkg5BI+dJjjuHLpsiddN6pdo8RRlMxo0xhQ9BAyOQz6hVxyOKRnxjJ61IxLdVdcz/xK363LtyrggvTExVqWyjAURhZSk5Tj399NpIYQVQ+/NAkjwQXXnuzip6iNTKrMlQ7yeiuNx5aW4CZ0dtv0cFQCgeIPeU4I769s6N27erlNcZ+oqDC1OtFDrrL3JSUY7IGMY7wcfOgG69vYFmrp7Eu4q7dEyTFkynnJiS4G22C0FOcWxhCB6iQrkT/ALfzqYsjb2sVabJqbV+OUCksH6f6CPhMhLoP3Z5ghKFJJHuQQOvOvrp0cCRW9aCsA7Y2+nfGxzsP9qMTbFw3NcVVobNejvNUma62liVKWnKEFaQptJB6xj+Nd+1tswIW68C3bqYgT4y1ykusPBL0ZY+mWQFBacKwceR5A0x5157NQbfm0eVL+uqIZfhh5yC+6t2S2S2tXIIIKuYOVDr38arteu2bUXauTUJk+pS60+9HaixI8VaY/qqktpKMlOVHiod/b3oUhJXTnnauYERH1Ebrzk7HHlV4qeLapEZui0mPT4UMutNsx4zSEtIUVjACEjCcnHgDXu/5FJty9aXOcejSFRYqHihSgkgla+ge/wAd6/Nna7Zq9L6vRlilux6A7RZCHnp00qb+mWhztTfEEqcSR0BjseRprb12VVIl6RKexWa7ebsalRVyahOV9StCnpL6G0FQACEqUk4Tk9qPfepslqIRoDZY78VZim+NcSOoVACOfGr82tedKvCW+lMRMYxG0upKnSpKuRIHfEf2q/xrNUt2dtTdX6RMqZum5QbcSOEOnQH2xIOM5580EIAOcYKs58gazR4+oRRLpmOW8hU+46JJcPrtMBfX/tOuQzt/XZMdupxaFU3EkoaQ820+oA+QkEEn+BpaW1SttaLuXU3p0miLE2M88mLJbSyin4eQlLSm1gIC1JPLGeYwoFCcHkmaG3PrsyDR6FLVBqUl9piNLKij0nML+7kn7hj8d6YG6W1NMsa14Vyy6pPqtWkVBtidJlPlwvOFtZUoZ7xyR7knvvVG6sV6XKIO0Lax4cUCDqp6nAbzswug8eO3/alL72s2np1t1a7aTU61UHWV8w3EnsOsIW4sHCuDH2pwTjKgPAz2NakWLsvc9hwoVEuGjUmX6nqio1GLGVUenF5S4eSFY7wDy/pCete9j7clXLGrAYmJjU5K2USWhnk6oIJSOP8ASR9oySCehj50ot74cak7nVumxWUNttiMlIQniADHbJ6/k/8A5pBg0rm3LHK03aiOBRexoBq7ud8+NHsGxbEsjcikUy6q7Lnx5amH4zyIaWY5d9UcUuc1LSto9ZUk4x7+dWFp79n076lmhu01CVpLnoQAklWE9kIb7V0O8A+NJ9jZWcnbmTctzXpUaqpmjOTYbPquJQ22GAtKFclKJwQRgYBGl3bVv16867Ao1m15ygVRSioT0OLbU2gD7gC2eRyPbIz8jQY1YN2iNxVG/lSUrBKnzedWKhSbVagTmKzNgxn30rbAqBabT7j7OeD7jOPHWg2fQW4cSNURVoE+J6hQp2CpTqB4yApKeORkdEjSv35saVYTFsqmXXV689MTM9Z2oSC52ks9oSc8c8++znA0RbDbZVq8qI/XXr8q1Po6ZDiE0uE8tpLjiCkqWshWPBAwEg//ACGvHQOnb5O9IxgPP8EVGV4NT8G37Vl1aUq36lRqfKeeK3TIKY8iUnvHPiCSrODg5IwPjRTa1EgfWercc2I5T4JdCfW+6MvOEEK9RKQPuUMEjsgY0qLgiQkXDUaOGsut1B2Ih4jJSr1SlKgScjHznJ0VXhs/KsDbidOrl61muzogjpd9WW4mMVGQhPJLWfOCnPIntORjTc8YEYBbmk7QrJIzAboc+uPLimy3OtqNSZdPoDsNSE8j6EJIUEhR6PBHgZPnGNQr8i1H7bfpsis0uPMf+7/3B1ppSVZGCM/dw66/OdIix7Oue/a99LaF5TLYMdguzpMZ1xDjrP8AaAgjkc/JxqG3ytZyxrxgUpdbqFWWukNPOSJz5dWpRddSQCrwPtzj5J0EgykW7N6U0zRwIbxE2OxGac8yiRKdJgyJ9TbkwXx1IhJU4CM9lCiAhR6+f51monZraWrVe0qbclav2srp76Q7CpcaStphhPJQIUAfuyoZwOIx86zSEsvYNoPdTtvavJGGjIUeHNf/2Q==",
        104,78     
      )



      this.filePath = {
        shader: {
          highVertexShader: "assets/shader/highVertexShader.vert",
          highFragmentShader: "assets/shader/highFragmentShader.frag",
          mediumVertexShader: "assets/shader/mediumVertexShader.vert",
          mediumFragmentShader: "assets/shader/mediumFragmentShader.frag",
          lowVertexShader: "assets/shader/lowVertexShader.vert",
          lowFragmentShader: "assets/shader/lowFragmentShader.frag",

          superlowVertexShader: "assets/shader/lowVertexShader.vert",
          superlowFragmentShader: "assets/shader/lowFragmentShader.frag",
        },
  
        male: {
          highModelPath: "assets/crowd/model/male_high_merged.glb",
          highAnimationPath: "assets/crowd/animation/male_high_animations_merged.json",
          highTexturePath: textureData_male,//"assets/crowd/texture/maleTextureLow.webp",//"assets/crowd/texture/maleTextureHigh.webp",
  
          mediumModelPath: "assets/crowd/model/male_medium_merged.glb",
          mediumAnimationPath: "assets/crowd/animation/male_medium_animations_merged.json",
          mediumTexturePath: textureData_male,//"assets/crowd/texture/maleTextureLow.webp",//"assets/crowd/texture/maleTextureMedium.webp",
  
          lowModelPath: "assets/crowd/model/male_low.glb",
          lowTexturePath: textureData_male,//"assets/crowd/texture/maleTextureLow.webp",

          superlowModelPath: "assets/crowd/model/male_super_low.glb",
          superlowTexturePath: textureData_male,//"assets/crowd/texture/maleTextureLow.webp",
        },
  
        female: {
          highModelPath: "assets/crowd/model/female_high_merged.glb",
          highAnimationPath: "assets/crowd/animation/female_high_animations_merged.json",
          highTexturePath: textureData_female,//"assets/crowd/texture/femaleTextureLow.webp",//"assets/crowd/texture/femaleTextureHigh.webp",
  
          mediumModelPath: "assets/crowd/model/female_medium_merged.glb",
          mediumAnimationPath: "assets/crowd/animation/female_medium_animations_merged.json",
          mediumTexturePath: textureData_female,//"assets/crowd/texture/femaleTextureLow.webp",//"assets/crowd/texture/femaleTextureMedium.webp",
  
          lowModelPath: "assets/crowd/model/female_low.glb",
          lowTexturePath: textureData_female,//"assets/crowd/texture/femaleTextureLow.webp",

          superlowModelPath: "assets/crowd/model/female_super_low.glb",
          superlowTexturePath: textureData_female,//"assets/crowd/texture/femaleTextureLow.webp",
        },
      };
    }
  
    initAvatarParams() {
  
      const maleTexCount = this.manager.config.male.textureCount[0] * this.manager.config.male.textureCount[1];
      const femaleTexCount = this.manager.config.female.textureCount[0] * this.manager.config.female.textureCount[1];
      
      for (let i = 0; i < this.seatPositions.length; i++) {
  
        let param = {
          position: this.seatPositions[i],
          rotation: this.seats[i].slice(3, 9),
          scale: [2.6/3, 2.6/3, 2.6/3],
          animationSpeed: 10,
          LOD: -1,
          textureType: [0, 0, 0, 0],
          animationType: 0,
          animationStartTime: 0,
          animationEndTime: 0,
          bodyScale: [
            1,
            0.9 + 0.2 * Math.random(),
            0.9 + 0.2 * Math.random(),
            0.9 + 0.2 * Math.random(),
          ],
        };
  
        if (Math.random() < 0.5) {
          // 以0.5的概率生成男性
          param.animationType = Math.floor(
            Math.random() * this.manager.config.male.animationCount
          );
          param.textureType = [
            Math.floor(Math.random() * maleTexCount),
            Math.floor(Math.random() * maleTexCount),
            Math.floor(Math.random() * maleTexCount),
            Math.floor(Math.random() * maleTexCount),
          ];
          param.sex = "male";
        } 
        
        else {
          // 以0.5的概率生成女性
          param.animationType = Math.floor(
            Math.random() * this.manager.config.female.animationCount
          );
          param.textureType = [
            Math.floor(Math.random() * femaleTexCount),
            Math.floor(Math.random() * femaleTexCount),
            Math.floor(Math.random() * femaleTexCount),
            Math.floor(Math.random() * femaleTexCount),
          ];
          param.sex = "female";
        }
        this.manager.params.push(param);
  
      }
  
    }
  
    adjustParam() {
      for (let i = 0; i < this.manager.params.length; i++) {
        let param = this.manager.params[i];
        if (param.sex == "male") {
          if (
            param.textureType[0] == 6 ||
            param.textureType[0] == 11 ||
            param.textureType[0] == 13
          )
            param.textureType[0]--; // 去掉短袖短裤
          if (param.textureType[2] == 13) param.textureType[2]--;
        } else if (param.sex == "female") {
          if (param.textureType[0] == 14) param.textureType[0]--; // 去掉短袖短裤
          if (param.textureType[2] == 3 || param.textureType[2] == 7)
            param.textureType[2]--;
          if (param.textureType[2] == 4 || param.textureType[2] == 8)
            param.textureType[2]++;
        }
      }
    }
  
    setWaveAnimation(param, time) {
        if (time > param.animationEndTime) {
          let delta = (13 + Math.random() * 19) / param.animationSpeed;
          let Fun = (t, x, y) => {
            let freqency = 0.1,//频率
              intension = 10,//波浪边缘模糊程度
              WaveCount = 5;//同时几个波峰
            return intension * Math.sin(2 * Math.PI * t * freqency + WaveCount*Math.atan2(y, x)) + 0.5;
          }; //状态函数
          let status = Fun(time, param.position[0], param.position[2]);
            if (Math.random() > status)//坐下
              param.animationType = Math.floor(Math.random() * 5) + 1;
            else//站起
              param.animationType = Math.floor(Math.random() * 3) + 6;
          param.animationStartTime = time;
          param.animationEndTime = time + delta;
        }
      }
  
    setAvatarAnimation(param, time) {
      if (time > param.animationEndTime) {
        let delta;
        if (Math.random() < 0.1) { // 0.2的概率静止
          param.animationType = 0;
          delta = (3 + Math.random() * 67) / param.animationSpeed;
        } else { // 去掉敲键盘的动作
          param.animationType = Math.floor( Math.random() * this.manager.config[param.sex].animationCount - 1 ) + 2;
          delta = (17 + Math.random() * 22) / param.animationSpeed;
        }
        param.animationStartTime = time;
        param.animationEndTime = time + Math.floor(delta);
      }
    }
  
    initAvatarParamsGreedly() {
      const maleTexCount = this.manager.config.male.textureCount[0] * this.manager.config.male.textureCount[1];
      const femaleTexCount = this.manager.config.female.textureCount[0] * this.manager.config.female.textureCount[1];
      const rowNum = [24, 34, 28], col = 26;
  
      for (let l = 0; l < rowNum.length; l++) {
        const row = rowNum[l];
        for (let k = 0; k < 3; k++) {
          let bais = k * row * col;
          for (let p = 0; p < l; p++) {
            bais += rowNum[p] * col * 3;
          }
          let genId = (x, y) => {
            return bais + x * col + y;
          };
          for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
              const id = genId(i, j);
              let islegal = (x, y) => {
                if (x < 26 && x >= 0 && y < row && y >= 0) return true;
                else return false;
              };
              let param = {
                position: this.seatPositions[id],
                scale: [2.6, 2.6, 2.6],
                animationSpeed: 10,
                LOD: -1,
                textureType: [0, 0, 0, 0],
                animationType: 0,
                animationStartTime: 0,
                animationEndTime: 0,
                bodyScale: [
                  1,
                  0.9 + 0.2 * Math.random(),
                  0.9 + 0.2 * Math.random(),
                  0.9 + 0.2 * Math.random(),
                ],
              };
              let candidate = [];
              if (islegal(i - 1, j)) candidate.push(genId(i - 1, j));
              if (islegal(i - 1, j - 1)) candidate.push(genId(i - 1, j - 1));
              if (islegal(i - 1, j + 1)) candidate.push(genId(i - 1, j + 1));
              if (islegal(i, j - 1)) candidate.push(genId(i, j - 1));
              let comp = (a, b) => {
                let x = a,
                  y = b;
                let suma = 0,
                  sumb = 0;
                for (let t = 0; t < candidate.length; t++) {
                  const element = candidate[t];
                  let temp = this.manager.params[element];
                  suma += this.computePSNR(temp, x);
                  sumb += this.computePSNR(temp, y);
                }
                if (suma < sumb) return 1;
                if (suma > sumb) return -1;
                return 0;
              };
              if (Math.random() < 0.5) {
                // 以0.5的概率生成男性
                param.animationType = Math.floor( Math.random() * this.manager.config.male.animationCount );
                param.textureType = [
                  Math.floor( Math.random() * maleTexCount ),
                  Math.floor( Math.random() * maleTexCount ),
                  Math.floor( Math.random() * maleTexCount ),
                  Math.floor( Math.random() * maleTexCount ),
                ];
                param.sex = "male";
                if (candidate.length > 0) {
                  let toSort = [];
                  for (
                    let index = 0;
                    index < maleTexCount;
                    index++
                  ) {
                    let tmp = { position: [], textureType: [0, 0, 0, 0] };
                    tmp.position = param.position;
                    tmp.textureType[0] = index;
                    toSort.push(tmp);
                  }
                  toSort.sort(comp);
                  param.textureType[0] =
                    toSort[Math.floor(Math.random() * 3)].textureType[0];
                }
              } else {
                // 以0.5的概率生成女性
                param.animationType = Math.floor(
                  Math.random() * this.manager.config.female.animationCount
                );
                param.textureType = [
                  Math.floor(
                    Math.random() * this.manager.config.female.textureCount
                  ),
                  Math.floor(
                    Math.random() * this.manager.config.female.textureCount
                  ),
                  Math.floor(
                    Math.random() * this.manager.config.female.textureCount
                  ),
                  Math.floor(
                    Math.random() * this.manager.config.female.textureCount
                  ),
                ];
                param.sex = "female";
                if (candidate.length) {
                  let toSort = [];
                  for (
                    let index = 0;
                    index < femaleTexCount;
                    index++
                  ) {
                    let tmp = { position: [], textureType: [0, 0, 0, 0] };
                    tmp.position = param.position;
                    tmp.textureType[0] = index;
                    toSort.push(tmp);
                  }
                  toSort.sort(comp);
                  param.textureType[0] =
                    toSort[Math.floor(Math.random() * 3)].textureType[0];
                }
              }
              this.manager.params.push(param);
            }
          }
        }
      }
    }
  
    computeDisp() {
      // 峰值信噪比差异
      let texSum = 0;
      for (let i = 0; i < this.seatPositions.length; i++) {
        for (let j = i + 1; j < this.seatPositions.length; j++) {
          texSum += this.computePSNR(
            this.manager.params[i],
            this.manager.params[j]
          );
        }
      }
      console.log("diff_texture: ", texSum);
  
      // 局部差异
      let localSum = 0;
      for (let i = 0; i < this.seatPositions.length; i++) {
        for (let j = i + 1; j < this.seatPositions.length; j++) {
          localSum += this.computeLocal(
            this.manager.params[i],
            this.manager.params[j]
          );
        }
      }
      console.log("diff_local: ", localSum);
    }
  
    computePSNR(ava1, ava2) {
      const maleTexCount = this.manager.config.male.textureCount[0] * this.manager.config.male.textureCount[1];
      const femaleTexCount = this.manager.config.female.textureCount[0] * this.manager.config.female.textureCount[1];
  
      let diff = 0, id1, id2;
      if (ava1.sex == "male") id1 = ava1.textureType[0];
      else id1 = ava1.textureType[0] + maleTexCount;
      if (ava2.sex == "male") id2 = ava2.textureType[0];
      else id2 = ava2.textureType[0] + femaleTexCount;
      diff = this.psnr[id1][id2];
      // 两人物距离
      let vec = [
        ava1.position[0] - ava2.position[0],
        ava1.position[1] - ava2.position[1],
        ava1.position[2] - ava2.position[2],
      ];
      return (
        (2 * diff) /
        (Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]) *
          (this.seatPositions.length - 1) *
          this.seatPositions.length)
      );
    }
  
    computeLocal(ava1, ava2) {
      let diff = 0;
      for (let k = 1; k < 4; k++) {
        //三个部位
        diff += Math.abs(ava1.bodyScale[k] - ava2.bodyScale[k]);
      }
      let vec = [
        ava1.position[0] - ava2.position[0],
        ava1.position[1] - ava2.position[1],
        ava1.position[2] - ava2.position[2],
      ];
      return (
        (2 * diff) /
        (Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]) *
          (this.seatPositions.length - 1) *
          this.seatPositions.length)
      );
    }
  
    updateLOD() {//每一帧执行一次
      // if(document.getElementById("number").innerHTML!=="")
      //   return 
        
      if (this.lodFinished[3]==false) return;//记录数据的加载情况
  
      // const minFinishedLOD = 
      //   this.lodFinished[0]?0:
      //   this.lodFinished[1]?1:
      //   this.lodFinished[2]?2:3;

      const minFinishedLOD = 
        this.lodFinished[2]&&this.lodFinished[1]&&this.lodFinished[0]?0:
        this.lodFinished[2]&&this.lodFinished[1]?1:
        this.lodFinished[2]?2:3;

      const lod = this.lodController.update();
      let lodCount = {//三级LOD的个数
        male: [0, 0, 0,0],
        female: [0, 0, 0,0],
      };
      let time = this.clock.getElapsedTime();//用于同步人浪的时间
      for (let i = 0; i < lod.length; i++) {
        if (lod[i] != -1) {
          let param = this.manager.params[i];
          // this.setAvatarAnimation(param, time); // 原人物动作控制
          this.setWaveAnimation(param, time); // 人浪
          param.LOD = Math.max(lod[i], minFinishedLOD);
          param.index = lodCount[param.sex][param.LOD]++;
          this.setInstanceParam(param);
        }
      }
  
      this.manager.instanceGroup.male.forEach((group, i) => {
        if (lodCount.male[i] > this.manager.config.male.maxCount[i])
          console.warn(`Male LOD:${i}的instance数量设置不足!`); // instances个数不足
        group.mesh.count = lodCount.male[i];
        group.update();
      });
      this.manager.instanceGroup.female.forEach((group, i) => {
        if (lodCount.female[i] > this.manager.config.female.maxCount[i])
          console.warn(`Female LOD:${i}的instance数量设置不足!`); // instances个数不足
        group.mesh.count = lodCount.female[i];
        group.update();
      });
      // window.lod_count={//这个返回结果是三级LOD的人数，没有特别的作用
      //   "0":lodCount.male[0] + lodCount.female[0],
      //   "1":lodCount.male[1] + lodCount.female[1],
      //   "2":lodCount.male[2] + lodCount.female[2],
      //   "3":lodCount.male[3] + lodCount.female[3],
      //   "sum":
      //     lodCount.male[0] + lodCount.female[0]+
      //     lodCount.male[1] + lodCount.female[1]+
      //     lodCount.male[2] + lodCount.female[2]+
      //     lodCount.male[3] + lodCount.female[3],
      // };
      // console.log(window.lod_count)

      // document.getElementById("number").innerHTML="同屏人数:"+ 
      // (lodCount.male[0] + lodCount.female[0])+","+  //高模
      // (lodCount.male[1] + lodCount.female[1])+","+  //中模
      // (lodCount.male[2] + lodCount.female[2])+","+ //低模
      // (lodCount.male[3] + lodCount.female[3]) //超低模
      
      // +(
      //     lodCount.male[0] + lodCount.female[0]+
      //     lodCount.male[1] + lodCount.female[1]+
      //     lodCount.male[2] + lodCount.female[2]+
      //     lodCount.male[3] + lodCount.female[3]
      // )

      // console.log(document.getElementById("number").innerHTML)
  
      return [//这个返回结果是三级LOD的人数，没有特别的作用
        lodCount.male[0] + lodCount.female[0], //高模
        lodCount.male[1] + lodCount.female[1], //中模
        lodCount.male[2] + lodCount.female[2], //低模
        lodCount.male[3] + lodCount.female[3], //超低模
      ];
    }
  
    setInstanceParam(param) {
      if (param.LOD == -1) return; // LOD为-1表示在视锥外
  
      // 人物旋转参数设置
      let rotation = param.rotation.slice(0, 3);
      if (param.LOD == 2 || param.LOD == 3) rotation = param.rotation.slice(3, 6);
  
      const instanceGroup = this.manager.instanceGroup[param.sex][param.LOD];
      // console.log(instanceGroup,param.LOD)
      instanceGroup.setAnimation(
        param.index,
        param.animationType,
        param.animationStartTime
      );
      instanceGroup.setSpeed(param.index, param.animationSpeed);
      instanceGroup.setTexture(param.index, param.textureType);
      instanceGroup.setRotation(param.index, rotation); // 使Avatar面向前方
      
      if(param.LOD==2){
        instanceGroup.setPosition(param.index, [
          param.position[0],
          param.position[1],
          param.position[2]
        ]);
        instanceGroup.setScale(param.index, [
          1.2*param.scale[0],
          1.2*param.scale[1],
          1.2*param.scale[2]
        ]);
      }else if(param.LOD===3){
        instanceGroup.setPosition(param.index, [
          param.position[0],
          param.position[1],
          param.position[2]
        ]);
        instanceGroup.setScale(param.index, [
          1.8*param.scale[0],
          2.8*param.scale[1],
          1.8*param.scale[2]
        ]);
      }else{
        instanceGroup.setPosition(param.index, param.position);
        instanceGroup.setScale(param.index, param.scale);
      }
      
      instanceGroup.setBodyScale(param.index, param.bodyScale);
    }

    async createSuperLowAvatar() {
      // male
      const maleModel = await this.loadGLB(this.filePath.male.superlowModelPath);
      
      window.time3=performance.now()
      console.log(window.time3-window.time2,"3:maleModel = await this.loadGLB")

      const maleMesh = maleModel.scene.children[0];
  
      const maleInstanceGroup = new InstancedGroup(
        this.manager.config.male.maxCount[3],
        maleMesh,
        false,
        false,
        this.filePath.male.superlowTexturePath,
        false,
        this.manager.config.male.textureCount,
        this.camera,
        this.clock
      );
      maleInstanceGroup.vertURL = this.filePath.shader.superlowVertexShader;
      maleInstanceGroup.fragURL = this.filePath.shader.superlowFragmentShader;
  
      const maleInstanceMesh = await maleInstanceGroup.init();
      this.manager.instanceGroup.male[3] = maleInstanceGroup;
      this.avatar.add(maleInstanceMesh);

      window.time4=performance.now()
      console.log(window.time4-window.time3,"4:maleInstanceMesh = await maleInstanceGroup.init")
  
      // female
      const femaleModel = await this.loadGLB(this.filePath.female.superlowModelPath);
      const femaleMesh = femaleModel.scene.children[0];
  
      const femaleInstanceGroup = new InstancedGroup(
        this.manager.config.female.maxCount[3],
        femaleMesh,
        false,
        false,
        this.filePath.female.superlowTexturePath,
        false,
        this.manager.config.female.textureCount,
        this.camera,
        this.clock
      );
      femaleInstanceGroup.vertURL = this.filePath.shader.superlowVertexShader;
      femaleInstanceGroup.fragURL = this.filePath.shader.superlowFragmentShader;
  
      const femaleInstanceMesh = await femaleInstanceGroup.init();
      this.manager.instanceGroup.female[3] = femaleInstanceGroup;
      this.avatar.add(femaleInstanceMesh);
  
      this.lodFinished[3] = true;
    }
  
    async createLowAvatar() {
      // male
      const maleModel = await this.loadGLB(this.filePath.male.lowModelPath);
      const maleMesh = maleModel.scene.children[0];
  
      const maleInstanceGroup = new InstancedGroup(
        this.manager.config.male.maxCount[2],
        maleMesh,
        false,
        false,
        this.filePath.male.lowTexturePath,
        false,
        this.manager.config.male.textureCount,
        this.camera,
        this.clock
      );
      maleInstanceGroup.vertURL = this.filePath.shader.lowVertexShader;
      maleInstanceGroup.fragURL = this.filePath.shader.lowFragmentShader;
  
      const maleInstanceMesh = await maleInstanceGroup.init();
      this.manager.instanceGroup.male[2] = maleInstanceGroup;
      this.avatar.add(maleInstanceMesh);
  
      // female
      const femaleModel = await this.loadGLB(this.filePath.female.lowModelPath);
      const femaleMesh = femaleModel.scene.children[0];
  
      const femaleInstanceGroup = new InstancedGroup(
        this.manager.config.female.maxCount[2],
        femaleMesh,
        false,
        false,
        this.filePath.female.lowTexturePath,
        false,
        this.manager.config.female.textureCount,
        this.camera,
        this.clock
      );
      femaleInstanceGroup.vertURL = this.filePath.shader.lowVertexShader;
      femaleInstanceGroup.fragURL = this.filePath.shader.lowFragmentShader;
  
      const femaleInstanceMesh = await femaleInstanceGroup.init();
      this.manager.instanceGroup.female[2] = femaleInstanceGroup;
      this.avatar.add(femaleInstanceMesh);
  
      this.lodFinished[2] = true;
    }
  
    async createMediumAvatar() {
      // male
      const maleModel = await this.loadGLB(this.filePath.male.mediumModelPath);
      // const maleMesh = maleModel.scene.children[0].children[0].children[2];
      const maleMesh = maleModel.scene.children[0].children[0].children[1];
  
      const maleInstanceGroup = new InstancedGroup(
        this.manager.config.male.maxCount[1],
        maleMesh,
        this.filePath.male.mediumAnimationPath,
        null,
        this.filePath.male.mediumTexturePath,
        this.filePath.male.lightMapPath,
        this.manager.config.male.textureCount,
        this.camera,
        this.clock
      );
      maleInstanceGroup.body = this.manager.config.male.body;
      maleInstanceGroup.vertURL = this.filePath.shader.mediumVertexShader;
      maleInstanceGroup.fragURL = this.filePath.shader.mediumFragmentShader;
  
      const maleInstanceMesh = await maleInstanceGroup.init();
      this.manager.instanceGroup.male[1] = maleInstanceGroup;
      this.avatar.add(maleInstanceMesh);
  
      // female
      const femaleModel = await this.loadGLB(
        this.filePath.female.mediumModelPath
      );
      // const femaleMesh = femaleModel.scene.children[0].children[0].children[2];
      const femaleMesh =
        femaleModel.scene.children[0].children[0].children[1].children[0];
  
      const femaleInstanceGroup = new InstancedGroup(
        this.manager.config.female.maxCount[1],
        femaleMesh,
        this.filePath.female.mediumAnimationPath,
        null,
        this.filePath.female.mediumTexturePath,
        this.filePath.female.lightMapPath,
        this.manager.config.female.textureCount,
        this.camera,
        this.clock
      );
      femaleInstanceGroup.body = this.manager.config.female.body;
      femaleInstanceGroup.vertURL = this.filePath.shader.mediumVertexShader;
      femaleInstanceGroup.fragURL = this.filePath.shader.mediumFragmentShader;
  
      const femaleInstanceMesh = await femaleInstanceGroup.init();
      this.manager.instanceGroup.female[1] = femaleInstanceGroup;
      this.avatar.add(femaleInstanceMesh);
  
      this.lodFinished[1] = true;
    }
  
    async createHighAvatar() {
      // male
      const maleModel = await this.loadGLB(this.filePath.male.highModelPath);
      const maleMesh = maleModel.scene.children[0].children[0].children[1];
  
      const maleInstanceGroup = new InstancedGroup(
        this.manager.config.male.maxCount[0],
        maleMesh,
        this.filePath.male.highAnimationPath,
        false,
        this.filePath.male.highTexturePath,
        this.filePath.male.lightMapPath,
        this.manager.config.male.textureCount,
        this.camera,
        this.clock
      );
      maleInstanceGroup.body = this.manager.config.male.body;
      maleInstanceGroup.vertURL = this.filePath.shader.highVertexShader;
      maleInstanceGroup.fragURL = this.filePath.shader.highFragmentShader;
  
      const maleInstanceMesh = await maleInstanceGroup.init();
      this.manager.instanceGroup.male[0] = maleInstanceGroup;
      this.avatar.add(maleInstanceMesh);
      

      // female
      const femaleModel = await this.loadGLB(this.filePath.female.highModelPath);
      // const femaleMesh = femaleModel.scene.children[0].children[0].children[2];
      const femaleMesh =
        femaleModel.scene.children[0].children[0].children[2].children[0];
  
      const femaleInstanceGroup = new InstancedGroup(
        this.manager.config.female.maxCount[0],
        femaleMesh,
        this.filePath.female.highAnimationPath,
        false,
        this.filePath.female.highTexturePath,
        this.filePath.female.lightMapPath,
        this.manager.config.female.textureCount,
        this.camera,
        this.clock
      );
      femaleInstanceGroup.body = this.manager.config.female.body;
      femaleInstanceGroup.vertURL = this.filePath.shader.highVertexShader;
      femaleInstanceGroup.fragURL = this.filePath.shader.highFragmentShader;
  
      const femaleInstanceMesh = await femaleInstanceGroup.init();
      this.manager.instanceGroup.female[0] = femaleInstanceGroup;
      this.avatar.add(femaleInstanceMesh);
      

  
      this.lodFinished[0] = true;

      var scope=this
      // maleInstanceGroup.updateTexture("assets/crowd/texture/maleTextureMedium.webp",()=>{
      //   // textureData.flipY = false;
      //   // scope.manager.instanceGroup.female[1].uniforms.textureData={ value: textureData };
      //   scope.manager.instanceGroup.male[2].uniforms.textureData=
      //   scope.manager.instanceGroup.male[1].uniforms.textureData=
      //   scope.manager.instanceGroup.male[0].uniforms.textureData;
      //   maleInstanceGroup.updateTexture("assets/crowd/texture/maleTextureHigh.webp",()=>{
      //     scope.manager.instanceGroup.male[2].uniforms.textureData=
      //     scope.manager.instanceGroup.male[1].uniforms.textureData=
      //     scope.manager.instanceGroup.male[0].uniforms.textureData;
      //   })
      // })
      // femaleInstanceGroup.updateTexture("assets/crowd/texture/femaleTextureMedium.webp",()=>{
      //   scope.manager.instanceGroup.female[2].uniforms.textureData=
      //   scope.manager.instanceGroup.female[1].uniforms.textureData=
      //   scope.manager.instanceGroup.female[0].uniforms.textureData;
      //   femaleInstanceGroup.updateTexture("assets/crowd/texture/femaleTextureHigh.webp",()=>{
      //     scope.manager.instanceGroup.female[2].uniforms.textureData=
      //     scope.manager.instanceGroup.female[1].uniforms.textureData=
      //     scope.manager.instanceGroup.female[0].uniforms.textureData;
      //   })
      // })
      
      
      var maleTexturePath="assets/crowd/texture/maleTextureHigh"
      if(window.isIOS)maleTexturePath+="IOS"
      maleInstanceGroup.updateTexture(maleTexturePath+".webp",()=>{
        // textureData.flipY = false;
        // scope.manager.instanceGroup.female[1].uniforms.textureData={ value: textureData };
        // scope.manager.instanceGroup.male[3].uniforms.textureData=
        scope.manager.instanceGroup.male[2].uniforms.textureData=
        scope.manager.instanceGroup.male[1].uniforms.textureData=
        scope.manager.instanceGroup.male[0].uniforms.textureData;
        // alert("男性贴图加载完成")

        var femaleTexturePath="assets/crowd/texture/femaleTextureHigh"
        if(window.isIOS)femaleTexturePath+="IOS"
        femaleInstanceGroup.updateTexture(femaleTexturePath+".webp",()=>{
          // scope.manager.instanceGroup.female[3].uniforms.textureData=
          scope.manager.instanceGroup.female[2].uniforms.textureData=
          scope.manager.instanceGroup.female[1].uniforms.textureData=
          scope.manager.instanceGroup.female[0].uniforms.textureData;
          // alert("女性贴图加载完成")
        })
      })

      
      



    }
  
    loadJSON(path) {
      return new Promise((resolve, reject) => {
        const loader = new THREE.FileLoader();
        loader.load(path, (data) => {
          const json = JSON.parse(data);
          resolve(json);
        });
      });
    }
  
    loadGLB(path) {
      return new Promise((resolve, reject) => {
        const modelLoader = new GLTFLoader();
        modelLoader.load(path, (gltf) => {
          resolve(gltf);
        });
      });
    }
  
    loadAudio(path) {
      return new Promise((resolve, reject) => {
        new THREE.AudioLoader().load(path, (buffer) => {
          resolve(buffer);
        });
      });
    }
  }

export { AvatarManager };