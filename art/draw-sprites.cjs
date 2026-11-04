const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require('sharp');
const root=path.join(__dirname,'layers');
const P={ink:'#171e2d',edge:'#24263b',void:'#111724',hood:'#493854',hoodDark:'#342d46',hoodLight:'#63516e',hoodTop:'#77657e',trim:'#c5bdd2',trimShadow:'#948aa9',scarf:'#583a68',scarfDark:'#392b4c',scarfLight:'#745084',scarfLit:'#8b638f',teal:'#47636c',tealDark:'#304852',tealLight:'#6b858a',pale:'#c7ccca',paleShade:'#929eaa',leather:'#805765',leatherDark:'#523c4d',leatherLight:'#a67779',glove:'#383047',gloveLight:'#55435e',boot:'#3c354c',bootLight:'#65566d',sole:'#8a8c9b',cyan:'#8cd4d5',violet:'#af8ed0',rose:'#d6adcb',amber:'#e5c28c',shine:'#e5e1db',cup:'#b47838',cupDark:'#704322',cupMid:'#925c2b',cupLight:'#e6aa59',tea:'#54341e'};
function canvas(w,h){
 const data=Buffer.alloc(w*h*4),rgb=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
 const pixel=(x,y,c,a=255)=>{if(x<0||y<0||x>=w||y>=h)return;const i=(y*w+x)*4;const color=rgb(P[c]||c);data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=a;};
 const rect=(x,y,rw,rh,c)=>{for(let yy=y;yy<y+rh;yy++)for(let xx=x;xx<x+rw;xx++)pixel(xx,yy,c);};
 const inside=(x,y,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes;}return yes;};
 const poly=(points,c)=>{const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);for(let y=Math.min(...ys);y<Math.max(...ys);y++)for(let x=Math.min(...xs);x<Math.max(...xs);x++)if(inside(x+.5,y+.5,points))pixel(x,y,c);};
 const line=(points,c)=>{for(let i=1;i<points.length;i++){let [x,y]=points[i-1];const [tx,ty]=points[i],dx=Math.abs(tx-x),sx=x<tx?1:-1,dy=-Math.abs(ty-y),sy=y<ty?1:-1;let e=dx+dy;for(;;){pixel(x,y,c);if(x===tx&&y===ty)break;const e2=e*2;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}}}};
 const diamond=(x,y,r,base,light='shine')=>{poly([[x,y-r],[x+r,y],[x,y+r],[x-r,y]],'ink');poly([[x,y-r+1],[x+r-1,y],[x,y+r-1],[x-r+1,y]],base);line([[x,y-r+1],[x-r+1,y],[x,y+r-1]],light);};
 const save=async name=>{assert(data.some((v,i)=>i%4===3&&v===255),'Empty sprite');await sharp(data,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(root,name+'.png'));};
 return{data,pixel,rect,poly,line,diamond,inside,save,w,h};
}
function character(){
 const c=canvas(88,100),{pixel,rect,poly,line,diamond}=c;
 // Scarf tails sit behind the figure; the diamond chain is an intentional pixel path.
 poly([[43,34],[51,37],[56,42],[59,47],[65,49],[72,49],[78,52],[81,57],[82,64],[81,70],[78,74],[74,72],[76,67],[76,62],[73,58],[67,57],[60,57],[54,54],[49,49],[45,43]],'ink');
 poly([[45,36],[50,39],[54,43],[57,48],[62,51],[70,51],[76,53],[79,58],[80,64],[79,69],[78,71],[76,70],[78,66],[77,61],[73,56],[66,55],[60,55],[55,52],[51,47]],'scarf');
 poly([[49,39],[53,43],[56,48],[61,51],[68,52],[74,54],[78,59],[78,63],[76,59],[72,56],[65,54],[59,53],[54,49]],'scarfLight');
 poly([[47,45],[52,49],[56,55],[63,59],[68,60],[72,64],[73,70],[71,76],[68,79],[64,75],[64,70],[59,68],[53,64],[48,58],[44,51]],'ink');
 poly([[48,47],[51,51],[55,57],[61,61],[67,62],[70,65],[71,70],[69,75],[68,76],[66,73],[66,69],[61,66],[55,63],[50,57]],'scarfDark');
 line([[53,54],[57,59],[63,63],[68,65],[69,69]],'scarf');
 line([[51,42],[53,44],[57,49],[63,53],[69,54],[75,58],[78,64],[77,69]],'trimShadow');
 for(const [x,y]of[[53,44],[57,49],[63,53],[69,54],[75,58],[78,64]])line([[x,y-2],[x+2,y],[x,y+2],[x-2,y],[x,y-2]],'trim');
 // Seated thighs, full shins and broad flat soles; the seat is y=65, floor y=100.
 poly([[29,61],[35,63],[35,69],[31,76],[30,81],[30,91],[32,96],[31,100],[14,100],[14,96],[18,91],[17,81],[14,76],[13,72],[17,67],[23,64]],'ink');
 poly([[40,62],[47,62],[53,66],[57,73],[56,78],[54,81],[53,91],[58,96],[58,100],[40,100],[39,96],[41,90],[39,79],[36,71]],'ink');
 poly([[25,64],[32,64],[33,69],[29,75],[25,78],[20,78],[16,74],[17,70],[21,67]],'glove');
 poly([[23,66],[29,65],[31,68],[29,72],[24,75],[19,74],[17,72]],'gloveLight');
 poly([[23,67],[28,66],[30,68],[28,70],[21,71],[19,70]],'bootLight');
 line([[28,71],[25,73],[23,74]],'glove');
 poly([[41,64],[47,64],[52,68],[54,73],[52,77],[46,79],[41,74],[38,69]],'glove');
 poly([[42,66],[47,65],[51,69],[53,73],[49,76],[44,75],[40,71]],'gloveLight');
 poly([[43,67],[48,67],[51,70],[49,72],[43,71],[41,69]],'bootLight');
 line([[44,72],[47,74],[50,75]],'glove');
 rect(20,79,9,12,'boot');rect(43,79,9,12,'boot');rect(20,80,3,9,'bootLight');rect(43,80,3,9,'bootLight');
 poly([[18,77],[30,77],[30,81],[27,83],[21,82],[18,80]],'paleShade');
 line([[19,77],[21,79],[28,80],[29,78]],'pale');
 poly([[41,77],[53,77],[53,81],[49,83],[43,82],[41,80]],'paleShade');
 line([[42,77],[44,79],[51,80],[52,78]],'pale');
 poly([[20,87],[28,86],[29,90],[22,93],[18,94],[18,91]],'paleShade');
 line([[20,87],[24,88],[27,87]],'pale');
 poly([[43,86],[51,87],[53,91],[55,94],[48,92],[42,90]],'paleShade');
 line([[43,87],[47,88],[50,88]],'pale');
 poly([[20,92],[26,92],[29,96],[29,98],[16,98],[17,95]],'boot');
 poly([[44,92],[50,92],[56,96],[56,98],[42,98],[42,95]],'boot');
 line([[17,96],[23,95],[27,96]],'tealLight');line([[43,96],[48,95],[54,97]],'tealLight');
 rect(16,98,14,1,'sole');rect(42,98,15,1,'sole');rect(19,93,5,1,'bootLight');rect(44,93,5,1,'bootLight');
 // Tailored teal coat and split embroidered lap panels.
 poly([[20,37],[43,36],[50,42],[52,60],[48,66],[21,66],[16,59],[15,45]],'ink');
 poly([[21,39],[42,38],[47,43],[48,59],[43,64],[23,63],[19,58],[18,45]],'teal');
 poly([[22,41],[30,40],[28,58],[22,60],[20,54]],'tealLight');
 poly([[39,40],[44,41],[47,48],[45,59],[39,61],[35,57]],'tealDark');
 poly([[20,61],[33,62],[32,69],[28,73],[23,77],[16,75],[14,72],[16,66]],'ink');
 poly([[20,63],[31,64],[29,69],[26,72],[22,75],[16,73],[18,67]],'teal');
 line([[20,63],[18,67],[16,72],[21,74],[24,72]],'pale');
 line([[24,64],[24,67],[21,69],[22,71]],'paleShade');
 line([[21,70],[23,72],[21,74],[19,72],[21,70]],'pale');
 poly([[36,62],[48,61],[51,66],[55,72],[54,76],[49,77],[41,72],[38,68]],'ink');
 poly([[38,64],[47,63],[49,67],[53,73],[50,74],[43,70],[40,67]],'teal');
 line([[47,64],[49,68],[52,73],[49,74],[43,71]],'pale');
 for(const [x,y]of[[43,66],[46,69]])line([[x,y-2],[x+2,y],[x,y+2],[x-2,y],[x,y-2]],'paleShade');
 // Crossbody strap and belt stay behind the hands and cup.
 line([[44,41],[41,44],[38,47],[35,50],[31,54],[27,58],[22,62]],'leatherDark');
 line([[45,41],[42,44],[39,47],[36,50],[32,54],[28,58],[23,62]],'leatherLight');
 line([[46,41],[43,44],[40,47],[37,50],[33,54],[29,58],[24,62]],'leather');
 diamond(39,46,3,'leatherDark','pale');
 rect(23,61,23,3,'scarfDark');rect(24,61,21,1,'scarf');
 for(let x=25;x<45;x+=4){pixel(x,62,'scarfLight');pixel(x+1,63,'scarfLight');}
 // Right-hip satchel, with a mostly hidden rear dagger handle at belt level.
 rect(11,62,7,2,'glove');rect(10,62,1,2,'paleShade');
 poly([[13,62],[23,62],[24,67],[22,73],[11,73],[9,70],[10,65]],'ink');
 poly([[13,64],[21,64],[22,67],[20,71],[12,71],[11,69]],'leather');
 poly([[12,63],[22,63],[22,66],[18,68],[11,67]],'leatherLight');
 line([[12,67],[17,69],[21,67]],'leatherDark');diamond(17,67,2,'violet','cyan');
 // Suspended prism charm on the opposite side of the belt.
 rect(48,63,2,4,'paleShade');rect(48,64,2,1,'pale');diamond(49,70,3,'violet','cyan');pixel(49,69,'shine');pixel(49,71,'rose');
 // Hood silhouette turns toward screen left; its opening contains no eyes.
 poly([[16,13],[22,7],[29,3],[36,2],[44,5],[49,10],[52,15],[55,17],[54,20],[52,22],[54,29],[49,34],[42,36],[29,34],[18,30],[12,26],[12,21]],'ink');
 poly([[17,14],[23,8],[30,5],[36,4],[43,7],[47,12],[50,17],[53,18],[51,20],[50,25],[51,29],[47,32],[40,33],[29,32],[19,28],[14,25],[14,22]],'hood');
 poly([[23,9],[30,6],[36,5],[42,8],[43,12],[39,14],[34,13],[28,12]],'hoodLight');
 poly([[43,9],[47,14],[50,17],[54,18],[50,20],[46,18],[43,15]],'hoodDark');
 poly([[17,20],[22,19],[29,20],[36,22],[44,24],[49,27],[47,32],[40,34],[31,33],[24,30],[18,28],[14,25]],'void');
 poly([[31,28],[39,29],[46,30],[42,32],[35,31]],'#171c2a');
 line([[14,24],[16,21],[18,18],[22,18],[27,20],[33,22],[39,25],[45,28],[49,30]],'trim');
 line([[18,17],[20,14],[23,12],[27,12],[31,14],[33,17],[34,21]],'trimShadow');
 line([[20,17],[22,15],[25,14],[28,15],[30,18],[30,20]],'trim');
 line([[25,10],[29,8],[33,9],[36,11],[38,15],[39,21],[42,25]],'trim');
 line([[16,14],[21,9],[27,6],[31,5]],'tealLight');
 // The cowl overlaps the hood, neck and crossbody strap.
 poly([[18,30],[29,32],[41,34],[49,32],[53,35],[51,40],[45,43],[34,43],[23,39],[17,35]],'ink');
 poly([[20,32],[29,34],[41,36],[49,34],[51,36],[48,39],[41,41],[33,40],[23,37]],'scarf');
 line([[22,33],[31,36],[41,38],[48,36]],'scarfLight');
 line([[24,38],[33,41],[43,42],[49,39]],'scarfDark');
 line([[35,36],[38,38],[35,40],[32,38],[35,36]],'trimShadow');
 // Three distinct, layered prism shoulder plates on the sword side.
 for(const [dx,dy]of[[0,0],[-1,4],[-2,8]]){
  poly([[16+dx,37+dy],[22+dx,39+dy],[26+dx,43+dy],[20+dx,45+dy],[11+dx,44+dy],[12+dx,41+dy]],'ink');
  poly([[16+dx,38+dy],[21+dx,40+dy],[24+dx,43+dy],[19+dx,44+dy],[12+dx,43+dy]],'violet');
  poly([[16+dx,38+dy],[17+dx,41+dy],[12+dx,43+dy]],'cyan');
  poly([[17+dx,41+dy],[21+dx,40+dy],[24+dx,43+dy]],'rose');
  line([[13+dx,42+dy],[17+dx,41+dy],[20+dx,40+dy]],'shine');
 }
 // Arms, pixel mugs and glove joints are constructed at the same pixel scale.
 poly([[14,48],[20,48],[24,52],[26,56],[23,61],[17,61],[13,57],[11,53]],'ink');
 poly([[15,50],[19,50],[22,53],[23,57],[20,59],[16,58],[13,54]],'tealDark');
 poly([[17,51],[21,52],[24,55],[23,59],[20,60],[17,57]],'paleShade');
 line([[18,52],[20,53],[21,56],[22,57]],'pale');
 poly([[47,46],[51,48],[54,54],[52,60],[46,62],[41,59],[41,54]],'ink');
 poly([[47,48],[50,50],[52,54],[50,58],[46,60],[43,57],[44,53]],'tealDark');
 poly([[45,51],[48,51],[50,54],[49,58],[46,59],[43,57]],'paleShade');
 line([[46,52],[48,54],[47,57]],'pale');
 // Mug silhouette, rim, handle and warm reflected light.
 poly([[27,49],[38,49],[41,51],[40,54],[39,59],[40,62],[38,64],[29,64],[27,62],[28,59],[27,54],[25,52]],'ink');
 rect(39,53,5,6,'cupDark');rect(41,54,2,3,'void');
 poly([[28,51],[38,51],[39,53],[37,56],[37,60],[39,62],[37,63],[30,63],[29,61],[30,57],[28,54]],'cup');
 rect(30,54,2,6,'cupLight');rect(36,54,2,7,'cupMid');
 rect(28,50,10,1,'cupLight');rect(27,51,12,1,'cupLight');rect(29,51,8,1,'tea');rect(30,52,7,1,'cupDark');
 line([[30,62],[36,62]],'cupLight');
 poly([[23,53],[27,53],[30,55],[30,60],[27,62],[23,61],[21,58]],'ink');
 poly([[24,54],[27,54],[28,56],[27,60],[24,60],[23,58]],'glove');
 line([[24,55],[27,56]],'gloveLight');line([[24,58],[27,58]],'gloveLight');
 poly([[40,53],[44,53],[47,56],[46,60],[43,62],[39,60],[38,57]],'ink');
 poly([[41,54],[44,55],[45,57],[44,60],[41,60],[40,58]],'glove');
 line([[41,55],[44,56]],'gloveLight');line([[40,58],[44,58]],'gloveLight');
 return c;
}
function sword(){
 const c=canvas(28,74),{pixel,poly,line,diamond}=c;
 const axis=y=>Math.round(20-(y-2)*12/70);
 const shape=(points,color)=>poly(points.map(([u,y])=>[axis(y)+u,y]),color);
 for(let y=1;y<50;y++){const half=Math.min(3,Math.ceil((y-1)/2));for(let x=axis(y)-half;x<=axis(y)+half;x++)pixel(x,y,'ink');}
 const stops=[[3,[241,202,131]],[11,[224,158,139]],[20,[195,130,177]],[30,[151,112,192]],[39,[113,149,202]],[49,[97,213,211]]];
 for(let y=3;y<50;y++){
  let i=0;while(i<stops.length-2&&y>stops[i+1][0])i++;const [y0,a]=stops[i],[y1,b]=stops[i+1],t=Math.max(0,Math.min(1,(y-y0)/(y1-y0)));
  const half=Math.min(2,Math.floor((y-2)/2));for(let u=-half;u<=half;u++){const facet=u<0?1.08:.9;const rgb=a.map((v,k)=>Math.min(255,Math.round((v+(b[k]-v)*t)*facet)));pixel(axis(y)+u,y,'#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''));}
 }
 line(Array.from({length:42},(_,i)=>[axis(i+6),i+6]),'shine');
 line([[axis(35),35],[axis(38)-1,38],[axis(43)-2,43]],'shine');
 shape([[-8,50],[-4,49],[-2,48],[2,48],[4,50],[9,51],[9,54],[3,53],[0,57],[-3,54],[-9,53],[-9,51]],'ink');
 shape([[-7,51],[-3,50],[0,49],[3,51],[8,52],[8,53],[2,52],[0,55],[-2,53],[-8,52]],'paleShade');
 line([[-7,51],[-3,50],[0,49],[3,51],[8,52]].map(([u,y])=>[axis(y)+u,y]),'pale');
 const gx=axis(53);diamond(gx,53,4,'violet','shine');poly([[gx,50],[gx+2,53],[gx,56]],'rose');poly([[gx-3,53],[gx,53],[gx,56]],'cyan');pixel(gx,53,'shine');
 for(let y=57;y<68;y++)for(let u=-2;u<=2;u++)pixel(axis(y)+u,y,Math.abs(u)===2?'ink':'glove');
 for(let y=58;y<67;y+=2)line([[axis(y)-1,y],[axis(y)+1,y]],'gloveLight');
 diamond(axis(70),70,4,'violet','pale');pixel(axis(70),69,'cyan');pixel(axis(70),70,'shine');pixel(axis(70),71,'rose');
 return c;
}
(async()=>{await character().save('spellblade-seated');await sword().save('prism-sword');console.log('Exported approved native pixel sprites');})().catch(e=>{console.error(e);process.exitCode=1});
