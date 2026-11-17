// Shared facade detail and reproducible street, confrontation and pursuit staging.
export function prepareScenes({THREE,scene,city,camera,player,cars,police,people,state,shot,keys}) {
  const canvas=document.createElement('canvas');
  canvas.width=128; canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#c5c3b8'; ctx.fillRect(0,0,128,256);
  for(let y=8;y<256;y+=32) for(let x=8;x<128;x+=32) {
    ctx.fillStyle='#817e76'; ctx.fillRect(x-2,y-2,22,26);
    ctx.fillStyle=(x+y)%64===16?'#b5cdcf':'#344b59'; ctx.fillRect(x,y,18,22);
    ctx.fillStyle='#d8d2b6'; ctx.fillRect(x,y+22,20,2);
  }
  const windows=new THREE.CanvasTexture(canvas);
  windows.colorSpace=THREE.SRGBColorSpace;
  for(const building of city.children) {
    const size=building.geometry?.parameters;
    if(size?.width!==18 || size?.depth!==18) continue;
    const wall=building.material, roof=wall.clone();
    wall.map=windows; wall.needsUpdate=true;
    building.material=[wall,wall,roof,roof,wall,wall];
  }
  const rivals=scene.children.filter(object=>object.userData.actor?.group);
  if(shot==='combat') {
    state.objective='Confront the Brass Tide crew at the plaza';
    player.group.position.set(0,0,18);
    rivals.forEach((r,i)=>r.position.set(-6+i*4,0,6+(i%2)*3));
    const pistol=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,.85),new THREE.MeshStandardMaterial({color:0x252b31}));
    pistol.position.set(.55,1.8,-.5); player.group.add(pistol);
  } else if(shot==='chase') {
    const car=state.inVehicle;
    car.group.position.set(0,.65,28); car.group.rotation.y=0; car.speed=18;
    player.group.position.copy(car.group.position);
    keys.w=true;
    police.forEach((p,i)=>{
      p.group.position.set(i===0?-3:i===1?3:0,.65,i===2?40:20+i*5);
      p.light.material.emissive=new THREE.Color(0x267cff);
      p.light.material.emissiveIntensity=3;
    });
  } else {
    cars[0].group.position.set(3,.65,27);
    cars[0].traffic=false;
  }
  const position=object=>object.position.toArray();
  const projected=object=>{
    const point=object.position.clone().add(new THREE.Vector3(0,1,0)).project(camera);
    return point.toArray();
  };
  const visible=object=>{
    const [x,y,z]=projected(object);
    return object.visible && Math.abs(x)<1 && Math.abs(y)<1 && z>-1 && z<1;
  };
  Object.defineProperty(window,'__game',{configurable:true,get:()=>({
    player:position(player.group),wanted:state.wanted,mission:state.mission,
    objective:state.objective,paused:state.paused,inVehicle:!!state.inVehicle,
    weapon:state.weapon,speed:state.inVehicle?.speed||0,
    police:police.map(p=>({position:position(p.group),projection:projected(p.group),visible:visible(p.group),flashing:p.light.visible})),
    pedestrians:people.length,visiblePedestrians:people.filter(p=>visible(p.group)).length,
    rivals:rivals.length,visibleRivals:rivals.filter(visible).length,
    camera:camera.position.toArray(),cameraViewProjection:new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).toArray()
  })});
}
