// caleb Doiron random maze game 
"use strict";
var gl;
var canvas;

var shader_program_0;
var sky_shader_program;
var direction_projection_inv_loc
var platform_width = 1000;
var platform_height  = 1000;
var quad_buffer;
var quad_loc;
var skybox_loc;
//elements
var menu ;
var maze_change;
var maze_parameters;
var start_button;
var resume_button;
//matrixes for view
var transform_view_mat;
var rotation_view_mat;
var translation_view_mat;
var perspective_mat;
//matrix location
var transform_mat_loc;
//platform 
var platform_vertices;
var platform_buffer;
var texture_loc;
//texture coordinates
var textcoord_loc;
var textcoords;
var textcoord_buffer;
var walls_text_coords;
var walls_text_coords_buffer;
//texture picture options
var texture_options = ["brick1.jpg","brick2.png","paving 4.png","concrete.jpg","stone.png","stone_wall.png","stone_floor.png","metal2.png","metal1.png","clover 1.png","grass1.png"];
//positions location
var position_loc;
//normals
var normals_loc;
var platform_normals;
var wall_normals;
var platform_normals_buffer;
var wall_normals_buffer;

//axis
var alpha;
var beta;
var camera_x;
var camera_y;
var camera_z;
var camera_direction;
// mouse 
var drag;//this is a flag that is set when the mouse is held down
var mouse_coords;//current mouse coordinates
var sensitivity = 80; //scale factor of length of drag to degrees of rotation
var zoom_sensitivity= .15;
//lines for walls
var lines;//list of walls 
//walls
var walls_buffer;
var walls_vertices;
var walls_height = 3;
var walls_thickness = .5;
//maze paremeters
var maze_cell_size= 2;
var cells;
var start_cell;
var maze_rows = 20;//in cells
var maze_columns = 20;
var reverse_sun_direction_loc;
var ambient_lighting_loc;
var specular_flag;
var camera_position_location;
var wall_flag_loc;
//lighting 
var diffuse_loc;
var specular_loc;
var shine_loc;
//movement variables
var delta_time = 0;
var last_time = Date.now();
var forward = 0;
var left = 0;
var right = 0;
var backword = 0;
var speed = .002;
var maze_built = 0;
//game variables
var game_mode = 0;
var player_height = 1;
var player_speed =        .000080*maze_cell_size;
var player_acceleration = .0000005*maze_cell_size;
var player_mouse_sensativity = .04;
var x_speed = 0;
var z_speed = 0;
var f_speed = 0;
var b_speed = 0;
var l_speed = 0;
var r_speed = 0;
var pointer_lock_bit = 0;



function init(){
   maze_parameters = document.getElementById("maze_parameters");
   maze_change = document.getElementById("change_maze");
   start_button = document.getElementById("start_game");
   
   resume_button = document.getElementById("resume");
    menu = document.getElementById("maze_menu");
    drag = 0;
    canvas = document.getElementById("gl-canvas");
    //pointer lock cross compatable for game mode
    
    canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;
    gl = WebGLUtils.setupWebGL(canvas);
    canvas.width = window.innerWidth;
    canvas.height= window.innerHeight;
    //setup skybox
    
    shader_program_0  = initShaders(gl,"vertex-shader-0","fragment-shader-0");
    gl.useProgram(shader_program_0);
   
    gl.viewport( 0, 0, window.innerWidth, window.innerHeight );  
    gl.clearColor(0.6,0.6,1.0,1.0);
    gl.enable( gl.DEPTH_TEST );
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    

    //setup lighting variables
    diffuse_loc = gl.getUniformLocation(shader_program_0,"udiffuse");
    gl.uniform1f(diffuse_loc,.5);
    specular_loc = gl.getUniformLocation(shader_program_0,"uspecular");
    gl.uniform1f(specular_loc,.2);
    shine_loc = gl.getUniformLocation(shader_program_0,"ushine");
    gl.uniform1f(shine_loc,30)
    //setup walls
    
   
    walls_vertices = [];
    walls_text_coords = [];
    wall_normals =[];
    lines = [];
    
    walls_buffer = gl.createBuffer();
    walls_text_coords_buffer = gl.createBuffer();
   

    //set up platform
   
    platform_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, platform_buffer);
    setup_platform(platform_width, platform_height);
    gl.bufferData(gl.ARRAY_BUFFER,platform_vertices,gl.STATIC_DRAW);
    position_loc = gl.getAttribLocation(shader_program_0, "aposition");
    gl.vertexAttribPointer(position_loc,4,gl.FLOAT, false, 0,0 );
    gl.enableVertexAttribArray(position_loc);
    textcoord_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,textcoord_buffer);
    setup_textcoords();
    gl.bufferData(gl.ARRAY_BUFFER,textcoords,gl.STATIC_DRAW);
    textcoord_loc = gl.getAttribLocation(shader_program_0,"atextcoord");
    gl.vertexAttribPointer(textcoord_loc,2,gl.FLOAT, false,0,0);
    gl.enableVertexAttribArray(textcoord_loc);


    //set up matrix
    alpha = 0;
    beta =  -90;
    camera_z = 0;
    camera_y = 50;
    camera_x = 0;
    let rot_y = alpha*2*Math.PI/360;
let rot_x = beta*2*Math.PI/360;
   camera_direction = [-Math.sin(rot_y),Math.sin(rot_x),-Math.cos(rot_y)];

    
    perspective_mat = perspective(70,canvas.width/canvas.height,.1,1000);
    
    rotation_view_mat = rotate(beta,[1,0,0]);
    translation_view_mat = translate(camera_x,camera_y,camera_z);
    transform_mat_loc = gl.getUniformLocation(shader_program_0, "umatrix");
    

    


   

    //setup textures
     gl.activeTexture(gl.TEXTURE0);
    var texture_buffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,texture_buffer);
    const pixels = new Uint8Array([
        150, 100, 150, 100, 
        100, 150, 100, 150, 
        150, 100, 150, 100, 
        100, 150, 100, 150 
      ]);
    gl.texImage2D(gl.TEXTURE_2D, 0,gl.LUMINANCE,4,4,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    
    texture_loc  = gl.getUniformLocation(shader_program_0,"utexture");
     
    
    
    //wall texture
    gl.activeTexture(gl.TEXTURE1);
    var wall_texture_buffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,wall_texture_buffer);
    const wall_pixels = new Uint8Array([
        
        255, 200, 255, 200, 
        200, 255, 200, 255, 
        255, 200, 255, 200, 
        200, 255, 200, 255 
    
      ]);
    gl.texImage2D(gl.TEXTURE_2D, 0,gl.LUMINANCE,4,4,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,wall_pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    
    //setup normals 
      normals_loc = gl.getAttribLocation(shader_program_0,"anormal");
     
      //platform 
      platform_normals_buffer = gl.createBuffer();
       gl.enableVertexAttribArray(normals_loc);
      gl.bindBuffer(gl.ARRAY_BUFFER,platform_normals_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, platform_normals,gl.STATIC_DRAW);

      wall_normals_buffer = gl.createBuffer();
      
      

    //sunlight direction
reverse_sun_direction_loc = gl.getUniformLocation(shader_program_0,"ureverse_light_dir");
gl.uniform3fv(reverse_sun_direction_loc, normalize( [1, .7, 1],false) );
//specualar variables
camera_position_location = gl.getUniformLocation(shader_program_0, "camera_pos");
gl.uniform3fv(camera_position_location, [camera_x,camera_y,camera_z],false );
wall_flag_loc = gl.getUniformLocation(shader_program_0,"wall_flag");

      //setup skyshader
      sky_shader_program = initShaders(gl,"vertex-shader-1","fragment-shader-1");
      gl.useProgram(sky_shader_program);
     quad_buffer = gl.createBuffer();
      var quad_positions = new Float32Array(
          [
              -1,-1,
              1,-1,
              -1,1,
              -1,1,
              1,-1,
              1,1
          ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer, gl.STATIC_DRAW);
        
        gl.bufferData(gl.ARRAY_BUFFER, quad_positions, gl.STATIC_DRAW);
        
        quad_loc = gl.getAttribLocation(sky_shader_program,"aposition");
        
        gl.vertexAttribPointer(quad_loc, 2, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(quad_loc);
        gl.activeTexture(gl.TEXTURE2);
        var sky_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP,sky_texture);
        const sky_faces = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: "textures/envmap_miramar/miramar_rt.png",
              },
              {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: 'textures/envmap_miramar/miramar_lf.png',
              },
              {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: 'textures/envmap_miramar/miramar_up.png',
              },
              {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: 'textures/envmap_miramar/miramar_dn.png',
              },
              {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: 'textures/envmap_miramar/miramar_ft.png',
              },
              {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: 'textures/envmap_miramar/miramar_bk.png',
              },
                        
        ];
        sky_faces.forEach((faceInfo)=> {
            const {target,url} = faceInfo;
            const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1024;
    const height = 1024;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
   
    const sky_image = new Image();
    sky_image.src = url;
    sky_image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP,sky_texture);
        gl.texImage2D(target,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sky_image);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        
        
    });

        } );
        
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
 
 skybox_loc = gl.getUniformLocation(sky_shader_program,"skybox");
 gl.uniform1i(skybox_loc,2);
 direction_projection_inv_loc = gl.getUniformLocation(sky_shader_program, "inverseprojection");
gl.uniformMatrix4fv(direction_projection_inv_loc,false,flatten(mat4())); 

        gl.useProgram(shader_program_0);
       calculate_transform();

        
        
    //define input event handlers
    document.body.onkeydown = on_key_down;
    document.body.onkeyup = on_key_up;
    document.body.onresize = resize_canvas;
    canvas.onmousemove= mouse_rotate;
    canvas.onmousedown = mouse_down;
    canvas.onmouseup = mouse_up;
    canvas.onmouseover = mouse_over;
    document.body.onwheel = scroll_y;
    document.getElementById("GM").onclick = build_maze_walls;
    resume_button.onclick = resume_game;
     maze_change.onclick = endgame;
    start_button.onclick= start_game;
    document.getElementById("diffuse").oninput = function(){
        gl.uniform1f(diffuse_loc,this.value);
    };
    document.getElementById("specular").oninput= function(){
        gl.uniform1f(specular_loc,this.value);
    };
    document.getElementById("shine").oninput = function(){
        gl.uniform1f(shine_loc,this.value);
    };
    document.getElementById("cell_size").oninput = function(){
        maze_cell_size = this.value;
        if(maze_built){
            lines = [];
            walls_vertices = [];
            walls_text_coords = [];
            generate_lines();
            build_walls(lines);
            buffer_maze();
        }
    };
    document.getElementById("wall_height").oninput = function(){
        walls_height = this.value;
        if(maze_built){
            
            walls_text_coords = [];
            walls_vertices = [];
            build_walls(lines);
            buffer_maze();
        }
    };
    document.getElementById("wall_width").oninput = function(){
        walls_thickness = Math.abs(this.value);//???? why does this work

        if(maze_built){
            
            lines = [];
            walls_vertices = [];
            walls_text_coords = [];
            generate_lines();
            build_walls(lines);
            buffer_maze();
        }
    };
    document.getElementById("rows").oninput = function(){
        maze_rows = this.value;
       
    };
    document.getElementById("columns").oninput = function(){
        maze_columns = this.value;

    };
    document.getElementById("velocity").oninput = function(){
    player_speed = (this.value/100000) * maze_cell_size;
    
    };
    document.getElementById("acceleration").oninput = function(){
        player_acceleration = (this.value/100000) * maze_cell_size;
        
    };
    document.getElementById("pheight").oninput = function(){
        player_height = this.value;
        if(game_mode)
        camera_y = player_height;
    };
    document.getElementById("sensativity").oninput = function(){
        player_mouse_sensativity = this.value/10;
    };
    //texture selection
    document.getElementById("platform_texture").oninput = function(){
        if(this.value > 0){
       var texture_im_plat = new Image();
        texture_im_plat.src = "textures/"+texture_options[this.value-1];

        texture_im_plat.addEventListener('load', function() {
            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D,texture_buffer);
            
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, texture_im_plat);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          });
        }else{
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D,texture_buffer);
            gl.texImage2D(gl.TEXTURE_2D, 0,gl.LUMINANCE,4,4,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,pixels);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
            
        }
    };
    document.getElementById("wall_texture").oninput = function(){
        if(this.value > 0){
            var texture_im_wall = new Image();
            texture_im_wall.src = "textures/"+texture_options[this.value-1];
            texture_im_wall.addEventListener('load',function(){
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D,wall_texture_buffer);
                
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, texture_im_wall);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            });
        }else{
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D,wall_texture_buffer);
            gl.texImage2D(gl.TEXTURE_2D, 0,gl.LUMINANCE,4,4,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,wall_pixels);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        }

    };
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    
    animate();
}
//setup functions
function setup_textcoords(){
textcoords = new Float32Array([
    0,0,
    platform_height,platform_width,
    0,platform_height,
    platform_height,0,
    platform_height,platform_width,
    0,0
]);


}

function setup_platform(width, height){
platform_vertices = new Float32Array([
    -height/2,0,width/2,1,
    height/2,0,-width/2,1,
    -height/2,0,-width/2,1,
    height/2,0,width/2,1,
    height/2,0,-width/2,1,
    -height/2,0,width/2,1
]);

//gl.bufferData(gl.ARRAY_BUFFER,platform_vertices,gl.STATIC_DRAW);
platform_normals = new Float32Array([
    0,1,0,
    0,1,0,
    0,1,0,
    0,1,0,
    0,1,0,
    0,1,0,
]);
}
//generate the wall lines for maze
function generate_cells(){
// wilsons algorithm(loop-erased random walks) note: this may take long but is uniformly random
//generate grid of cells each cell has four wall e, w , n, s
var fails = 0;
var i = 0;
var j = 0;
var width = maze_columns;
var height = maze_rows;
cells = [];
var walk_finish = 0;
var path =  [];
for( i=0; i<height; i++) {
    cells[i] = new Array(width);
}
for( i = 0; i < height; i++){
    for( j = 0; j < width; j++)
    {
        cells[i][j] = {e:1,w:1,n:1,s:1,used:0};
    }
}
//start the maze at the front corner 

cells[0][0].used = 1;

//exit will be the opposite corner 
cells[height-1][width-2].n = 0;
for( i = 0; i < height; i++){
    for( j = 0; j < width; j++)
    {
        if(cells[i][j].used == 0){
            
            path = [];
            walk_finish = 0;
            //start the random walk
            path.push({row:i,col:j});
            var lastdir = -1;//0 = n, 1 = e, 2 = s, 3 = w
            while(!walk_finish){
                //console.log(lastdir);
               
               let opt = [];
                for(let d = 0; d < 4; ++d ){
                    if((lastdir != ((d+2)%4) || lastdir == -1)
                    && !(path[path.length-1].row == 0 && d == 2)
                    && !(path[path.length-1].row == height -1  && d == 0) 
                    && !(path[path.length-1].col == 0  && d == 3)
                    && !(path[path.length-1].col == width -1  && d == 1)){
                        opt.push(d);
                    }
                }
                lastdir = opt[Math.floor(Math.random()*opt.length)];
                //console.log(lastdir);
                if(lastdir == 0){path.push({row:path[path.length-1].row+1,col:path[path.length-1].col});}
                else if(lastdir == 2){path.push({row:path[path.length-1].row-1,col:path[path.length-1].col});}
                else if(lastdir == 3){path.push({row:path[path.length-1].row,col:path[path.length-1].col-1});}
                else if(lastdir == 1){path.push({row:path[path.length-1].row,col:path[path.length-1].col+1});}
                //check if the loop has completed
                if(cells[path[path.length-1].row][path[path.length-1].col].used == 1)
                {
                walk_finish = 1;
                
                //remove walls and set cells to used
                cells[path[0].row][path[0].col].used = 1;

               

                for(let p_cell = 1; p_cell < path.length; p_cell++){
                    cells[path[p_cell].row][path[p_cell].col].used = 1;
                    if(path[p_cell].row > path[p_cell-1].row){
                        cells[path[p_cell].row][path[p_cell].col].s = 0;
                        cells[path[p_cell-1].row][path[p_cell-1].col].n = 0;
                    } 
                    else if(path[p_cell].col < path[p_cell-1].col){
                        cells[path[p_cell].row][path[p_cell].col].e = 0;
                        cells[path[p_cell-1].row][path[p_cell-1].col].w = 0;

                    }
                    else if(path[p_cell].col > path[p_cell-1].col){
                        cells[path[p_cell].row][path[p_cell].col].w = 0;
                        cells[path[p_cell-1].row][path[p_cell-1].col].e = 0;
                    }
                    else{
                        cells[path[p_cell].row][path[p_cell].col].n = 0;
                        cells[path[p_cell-1].row][path[p_cell-1].col].s = 0;
                    }
                }
                
                }
                else{
                    //check if the walk has looped on itself if so reset the lastdir
                    
                    for(let p_cell = 0; p_cell < path.length-1; p_cell++){
                        if(path[p_cell].row == path[path.length-1].row && path[p_cell].col == path[path.length-1].col){
                            fails++;
                            let duplicate = path[p_cell];
                            path.pop();
                            
                            while(true){
                                let deleted = path.pop();
                                if(deleted.row ==duplicate.row && deleted.col ==duplicate.col){
                                    path.push(deleted);
                                    if(path.length == 1){
                                    lastdir = -1;
                                    }
                                    else{
                                    if(path[path.length-1].row > path[path.length-2].row){
                                        lastdir = 0;
                                    } 
                                    else if(path[path.length-1].col < path[path.length-2].col){
                                        lastdir = 3;
                                    }
                                    else if(path[path.length-1].col > path[path.length-2].col){
                                        lastdir = 1;

                                        
                                    }
                                    else if(path[path.length-1].row < path[path.length-2].row){
                                        lastdir = 2;
                                    }}
                                   break;
                                }

                            }

                            
                        }
                    }
                



                }


            }
            

        }
    }
}



generate_lines();
}

function generate_lines()
{

var temp_cells = [];
for(let  i=0; i<cells.length; i++) {
    temp_cells[i] = new Array(maze_rows);
}
for( let i = 0; i < cells.length; i++){
    for(let  j = 0; j < cells[0].length; j++)
    {
        temp_cells[i][j] = {e:cells[i][j].e,w:cells[i][j].w,n:cells[i][j].n,s:cells[i][j].s};
    }
}
    var point1;
    var point2;

//draw the walls for each cell
for( let i = 0; i < cells.length; i++){
    for( let j = 0; j < cells[0].length; j++)
    {
        let cell_x_coord = j * maze_cell_size - maze_cell_size*cells[0].length/2;
        let cell_y_coord = i * maze_cell_size - maze_cell_size*cells.length/2
        
        if(temp_cells[i][j].w == 1){//west wall
             point1 = [cell_x_coord - maze_cell_size/2, cell_y_coord-maze_cell_size/2];
            if(linecheck(point1))
            point1[1] =  point1[1]+walls_thickness;

             point2 = [cell_x_coord - maze_cell_size/2, cell_y_coord+maze_cell_size/2];
            if(linecheck(point2))
            point2[1] = point2[1]-walls_thickness;


        lines.push({p1:point1,p2:point2});
        if(j != 0){
            temp_cells[i][j-1].e = 0;
        }
        }
        if(temp_cells[i][j].e == 1){//east wall
            point1 = [cell_x_coord + maze_cell_size/2, cell_y_coord+maze_cell_size/2];
            if(linecheck(point1)) 
            point1[1] =  point[1]-walls_thickness;
            point2 = [cell_x_coord + maze_cell_size/2, cell_y_coord-maze_cell_size/2];
            if(linecheck(point2))
            point2[1] = point2[1]+walls_thickness;


        lines.push({p1:point1,p2:point2});
        if(j != cells[0].length - 1){
            temp_cells[i][j+1].w = 0;
        }
        }
        if(temp_cells[i][j].n == 1){//north wall
            point1 = [cell_x_coord + maze_cell_size/2, cell_y_coord+maze_cell_size/2];
            if(linecheck(point1))
            point1[0] = point1[0]-walls_thickness;
            point2 = [cell_x_coord - maze_cell_size/2, cell_y_coord+maze_cell_size/2];
            if(linecheck(point2))
            point2[0] = point2[0]+walls_thickness;

        lines.push({p1:point1,p2:point2});
        if(i != cells.length - 1){
            temp_cells[i+1][j].s = 0;
        }
        }
        if(temp_cells[i][j].s == 1){//south wall
            point1 = [cell_x_coord + maze_cell_size/2, cell_y_coord-maze_cell_size/2];
            if(linecheck(point1))
            point1[0] = point1[0]- walls_thickness;
            point2 = [cell_x_coord - maze_cell_size/2, cell_y_coord-maze_cell_size/2];
            if(linecheck(point2))
            point2[0] = point2[0] + walls_thickness;
        lines.push({p1:point1,p2:point2});
        if(i != 0){
            temp_cells[i-1][j].n = 0;
        }
        }
    }
}
}
//helper function makes sure the lines don't intersect so walls do not overlap
function linecheck(point){
    
    for( let i = 0; i < lines.length; i++){
        if((Math.abs(lines[i].p1[0] - point[0]) < .001 && Math.abs(lines[i].p1[1]- point[1]) < .001 )
        || (Math.abs(lines[i].p2[0] - point[0]) < .001 && Math.abs(lines[i].p2[1]- point[1]) < .001 )){
        
        return 1;
        }
    }
    return 0;
}
//creates walls and text coordinates from walls
function build_walls(l){
    
    var wh = 0
    var wv = 0;
    var left_x  = 0;
    var right_x = 0;
    var front_y = 0;
    var back_y  = 0;
    for(let i = 0; i < l.length; i++){
        
       
        //determine if the line is vertical or horizontal
        if(l[i].p1[1] == l[i].p2[1]){//line is horizontal

          if(l[i].p1[0] < l[i].p2[0]){
             wh = walls_thickness+l[i].p2[0]-l[i].p1[0];
             wv = walls_thickness;
             left_x  = l[i].p1[0]-walls_thickness/2;
             right_x = l[i].p2[0]+walls_thickness/2;
             front_y = l[i].p1[1]-walls_thickness/2;
             back_y  = l[i].p1[1]+walls_thickness/2;
           

          }
          else{
             wh = walls_thickness+l[i].p1[0]-l[i].p2[0];
             wv = walls_thickness;
             left_x  = l[i].p2[0]-walls_thickness/2;
             right_x = l[i].p1[0]+walls_thickness/2;
             front_y = l[i].p1[1]-walls_thickness/2;
             back_y  = l[i].p1[1]+walls_thickness/2;
          }
             
            
            
    
        }
        else{//line is vertical
            if(l[i].p1[1] < l[i].p2[1]){
                wv = walls_thickness+l[i].p2[1]-l[i].p1[1];
                wh = walls_thickness;
                left_x  = l[i].p1[0]-walls_thickness/2;
                right_x = l[i].p1[0]+walls_thickness/2;
                front_y = l[i].p1[1]-walls_thickness/2;
                back_y  = l[i].p2[1]+walls_thickness/2;
            }
            else{
                wv = walls_thickness+l[i].p1[1]-l[i].p2[1];
                wh = walls_thickness;
                left_x  = l[i].p1[0]-walls_thickness/2;
                right_x = l[i].p2[0]+walls_thickness/2;
                front_y = l[i].p2[1]-walls_thickness/2;
                back_y  = l[i].p1[1]+walls_thickness/2;

            }

            

        } 
        //front face
        generate_face([left_x,front_y],[right_x,front_y], wh);
        for(let norml = 0; norml < 6; norml++){
            wall_normals.push(0,0,1);
        }
        //back face
        generate_face([right_x,back_y],[left_x,back_y],wh);
        for(let norml = 0; norml < 6; norml++){
            wall_normals.push(0,0,-1);
        }
        //left face
        generate_face([left_x,back_y],[left_x,front_y],wv);
        for(let norml = 0; norml < 6; norml++){
            wall_normals.push(-1,0,0);
        }
        //right face
        generate_face([right_x,front_y],[right_x,back_y],wv);
        for(let norml = 0; norml < 6; norml++){
            wall_normals.push(1,0,0);
        }
        //generate top face
        walls_vertices.push(left_x,walls_height,-front_y,1);
        walls_text_coords.push(0,0);

        walls_vertices.push(right_x, walls_height, -front_y,1);
        walls_text_coords.push(wh,0);

        walls_vertices.push(right_x, walls_height, -back_y,1);
        walls_text_coords.push(wh,wv);

        walls_vertices.push(left_x,walls_height,-front_y,1);
        walls_text_coords.push(0,0);

        walls_vertices.push(right_x, walls_height, -back_y,1);
        walls_text_coords.push(wh,wv);

        walls_vertices.push(left_x,walls_height,-back_y,1);
        walls_text_coords.push(0,wv);
        for(let norml = 0; norml < 6; norml++){
            wall_normals.push(0,1,0);
        }


}
}
function generate_face(leftpt,rightpt,face_width){
    
    walls_vertices.push(leftpt[0],0,-leftpt[1],1);
    walls_text_coords.push(0,0);

    walls_vertices.push(rightpt[0],0,-rightpt[1],1);
    walls_text_coords.push(face_width,0);

    walls_vertices.push(leftpt[0],walls_height,-leftpt[1],1);
    walls_text_coords.push(0,walls_height);

    walls_vertices.push(rightpt[0],0,-rightpt[1],1);
    walls_text_coords.push(face_width,0);

    walls_vertices.push(rightpt[0],walls_height,-rightpt[1],1);
    walls_text_coords.push(face_width,walls_height);

    walls_vertices.push(leftpt[0],walls_height,-leftpt[1],1);
    walls_text_coords.push(0,walls_height);

}

function calculate_transform(){
    let camera = mult(translation_view_mat,rotation_view_mat);
    let model = inverse4(camera);
    let u_mat = mult(perspective_mat,model);
    gl.uniformMatrix4fv(transform_mat_loc,false,flatten(u_mat));
    let model2 = inverse4(rotation_view_mat);
    let u_mat2 = mult(perspective_mat,model2);
    gl.useProgram(null);
    gl.useProgram(sky_shader_program);
    gl.uniformMatrix4fv(direction_projection_inv_loc,false,flatten(inverse4(u_mat2)));

    gl.useProgram(shader_program_0);
}


function animate(){
    
    if(game_mode)
    player_movement();
    else
    movement();

    calculate_transform();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //draw platform
    
gl.uniform1i(wall_flag_loc,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,textcoord_buffer);
    gl.vertexAttribPointer(textcoord_loc,2,gl.FLOAT, false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, platform_buffer);
    gl.vertexAttribPointer(position_loc,4,gl.FLOAT, false, 0,0 );
    gl.bindBuffer(gl.ARRAY_BUFFER, platform_normals_buffer);
    gl.vertexAttribPointer(normals_loc,3,gl.FLOAT, false,0,0);
    gl.uniform1i(texture_loc,0);
    gl.drawArrays(gl.TRIANGLES,0,6);
    //draw walls
    if(maze_built){
    gl.uniform1i(wall_flag_loc,1);
    gl.bindBuffer(gl.ARRAY_BUFFER, walls_text_coords_buffer);
    gl.vertexAttribPointer(textcoord_loc,2,gl.FLOAT, false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, walls_buffer);
    gl.vertexAttribPointer(position_loc,4,gl.FLOAT, false, 0,0 );
    gl.bindBuffer(gl.ARRAY_BUFFER, wall_normals_buffer);
    gl.vertexAttribPointer(normals_loc,3,gl.FLOAT, false,0,0);
    gl.enableVertexAttribArray(normals_loc);
    gl.uniform1i(texture_loc,1);
    gl.drawArrays(gl.TRIANGLES,0,walls_vertices.length/4);
    }

    //draw_sky
    
    gl.useProgram(sky_shader_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer, gl.STATIC_DRAW);
    gl.vertexAttribPointer(quad_loc, 2, gl.FLOAT, false, 0,0);
    gl.uniform1i(skybox_loc,2);
    gl.drawArrays(gl.TRIANGLES,0,6);
gl.useProgram(shader_program_0);
    requestAnimationFrame(animate);
    

}
function mouse_rotate(e){
    if(drag){
    let new_mouse_coords = [2.0*(e.clientX)/canvas.width - 1.0, 
                            -(2.0*(e.clientY)/ canvas.height -1.0)];
         
    let rotate_y_axis = new_mouse_coords[0]-mouse_coords[0];
   let rotate_x_axis = new_mouse_coords[1]-mouse_coords[1];

   
alpha = alpha - sensitivity*rotate_y_axis;
beta = Math.max(Math.min(beta + sensitivity*rotate_x_axis,90),-90);

rotation_view_mat = mult(rotate(alpha,[0, 1, 0]),rotate(beta,[1, 0, 0]));
//rotate function converts to radians 
let rot_y = alpha*2*Math.PI/360;
let rot_x = beta*2*Math.PI/360;
   camera_direction = [-Math.sin(rot_y),Math.sin(rot_x),-Math.cos(rot_y)];
    
    mouse_coords = new_mouse_coords;

   
     
    }
}
//input control
function buffer_maze(){
    gl.bindBuffer(gl.ARRAY_BUFFER, wall_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(wall_normals),gl.STATIC_DRAW);
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER,walls_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(walls_vertices) ,gl.STATIC_DRAW);

   
    gl.bindBuffer(gl.ARRAY_BUFFER, walls_text_coords_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(walls_text_coords), gl.STATIC_DRAW);
}
function build_maze_walls(){
  if(maze_rows < 2 || maze_columns < 2){
      alert("Maze dimensions must be larger than 2");
      return;
  }
  lines = [];
  walls_vertices = [];
    walls_text_coords = [];
    generate_cells(lines);
    build_walls(lines);
   buffer_maze();
maze_built = 1;
}
function resize_canvas(){

    canvas.width = window.innerWidth;
    canvas.height= window.innerHeight;
    perspective_mat = perspective(70,canvas.width/canvas.height,.1,1000);
    calculate_transform();
    gl.viewport(0,0,window.innerWidth,window.innerHeight);
    
}

function scroll_y(event){
    
    
    camera_y = Math.max(camera_y+camera_direction[1]*zoom_sensitivity*event.deltaY,.1);
    
    translation_view_mat = translate(camera_x,camera_y,camera_z);
    //calculate_transform();

}
function movement(){
   delta_time = Date.now() - last_time;
 last_time = Date.now();
    let distance = speed/(60/1000)*delta_time;
    
    
    if(forward){
       
        camera_x = camera_x+camera_direction[0]*distance;
       
        camera_z = camera_z+camera_direction[2]*distance;
    }
    if(backword){
        camera_x = camera_x-camera_direction[0]*distance;
       
        camera_z = camera_z-camera_direction[2]*distance;
    }
    if(right){
        camera_x = camera_x-camera_direction[2]*distance;
       
        camera_z = camera_z+camera_direction[0]*distance;
    }
    if(left){
        camera_x = camera_x+camera_direction[2]*distance;
       
        camera_z = camera_z-camera_direction[0]*distance;
    }
    
    translation_view_mat = translate(camera_x,camera_y,camera_z);
    gl.uniform3fv(camera_position_location, [camera_x,camera_y,camera_z],false );
    }

//handlers
function mouse_down(e){

let clipx = 2.0*(e.clientX)/canvas.width - 1.0;
let clipy = -(2.0*(e.clientY)/ canvas.height -1.0);
mouse_coords = [clipx,clipy];

drag = 1;
}
function mouse_up(){
    drag = 0;
}
function mouse_over(){
    drag = 0;
}
function on_key_down(e){
if(e.keyCode == 65 ){
    left = 1;
}
else if(e.keyCode == 68){
    right = 1;
}
else if(e.keyCode == 87 ){
    forward = 1;
}
else if(e.keyCode == 83){
    backword = 1;
}
else if(e.keyCode == 80){
    if(game_mode){
//escape should reopen menu
if(pointer_lock_bit){
document.exitPointerLock();

pause();
}


    }

}
}
function pause(){
    if(game_mode == 1){
    canvas.onmousemove =null;
   start_button.style.display = "none";
   maze_parameters.style.display = "none";
   resume_button.style.display = "inline";
   maze_change.style.display = "inline";
menu.style.display= "block";
canvas.onmousemove= mouse_rotate;
    canvas.onmousedown = mouse_down;
    canvas.onmouseup = mouse_up;
    canvas.onmouseover = mouse_over;
    }
    else{
        endgame();
    }

}

function lockChangeAlert() {
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
      //console.log('The pointer lock status is now locked');
     pointer_lock_bit = 1; 
     
    } else {
     // console.log('The pointer lock status is now unlocked');
     pointer_lock_bit = 0;
     pause();
    }
  }

function on_key_up(e){
    if(e.keyCode == 65 ){
        left = 0;
    }
    else if(e.keyCode == 68){
        right = 0;
    }
    else if(e.keyCode == 87 ){
        forward = 0;
    }
    else if(e.keyCode == 83){
        backword = 0;
    }
   
}
//startMaze Menu
//start game;
function resume_game(){
    menu.style.display= "none";
    canvas.requestPointerLock();
   
    canvas.onmousemove = update_view_angle;
    canvas.onmousedown = "none";
    canvas.onmouseup = "none";
}
function start_game(){
if(maze_built){
    game_mode =  1;
    canvas.requestPointerLock();
   

    
    
    //canvas.onmousemove= null;
    canvas.onmousedown = null;
    canvas.onmouseup = null;
    
    canvas.onmouseover = null;
    document.body.onwheel = null;
    canvas.onmousemove = update_view_angle;
    beta = 0;
    alpha = 0;

    rotation_view_mat = mult(rotate(alpha,[0, 1, 0]),rotate(beta,[1, 0, 0])); 
    let rot_y = alpha*2*Math.PI/360;
    let rot_x = beta*2*Math.PI/360;
    rotation_view_mat = mult(rotate(alpha,[0, 1, 0]),rotate(beta,[1, 0, 0]));
       camera_direction = [-Math.sin(rot_y),Math.sin(rot_x),-Math.cos(rot_y)];
        camera_x =   - maze_cell_size*(cells[0].length)/2;
        camera_z =   maze_cell_size*(cells.length)/2;
    camera_y = player_height;
   
    translation_view_mat  = translate(camera_x,camera_y,camera_z);
       

    
   menu.style.display= "none";
    }
    else{
        alert("You must generate a maze first");
    }

}
function endgame(){
    menu.style.display = "block";
    start_button.style.display = "inline";
   maze_parameters.style.display = "block";
   resume_button.style.display = "none";
   maze_change.style.display = "none";



    game_mode = 0;
    drag = 0;
    
    canvas.onclick = null;
    
    
    canvas.onmousemove= mouse_rotate;
    canvas.onmousedown = mouse_down;
    canvas.onmouseup = mouse_up;
    canvas.onmouseover = mouse_over;
    document.body.onwheel = scroll_y;
    
    document.body.onwheel = scroll_y;
    document.body.onkeydown = on_key_down;
    document.body.onkeyup = on_key_up;
  
   alpha = 0;
    beta =  -90;
    camera_z = 0;
    camera_y = 50;
    camera_x = 0;
    camera_direction = [0,-1,0];
    rotation_view_mat = mult(rotate(alpha,[0, 1, 0]),rotate(beta,[1, 0, 0]));
}
function player_movement(){
    delta_time = Date.now() - last_time;
    last_time = Date.now();
    let speed_change  = player_acceleration*delta_time;
    
    let distance;
    
   
    
   var cell_x_coord = Math.abs(Math.round((maze_cell_size*(cells[0].length)/2 +camera_x)/maze_cell_size));
    var cell_z_coord = Math.abs(Math.round((maze_cell_size*(cells.length)/2 -camera_z)/maze_cell_size));
   
    if(cell_z_coord >= maze_rows){
        document.exitPointerLock();
        
        game_mode = 0;
        endgame();
        return;
    }
     let current_cell = cells[cell_z_coord][cell_x_coord];
     
    let cell_center_x =  cell_x_coord* maze_cell_size- maze_cell_size*(cells[0].length)/2;
    let cell_center_z =  -cell_z_coord*maze_cell_size +maze_cell_size*(cells.length)/2;
    if(forward){
        f_speed = Math.min(f_speed+speed_change, player_speed);
        distance = f_speed/(60/1000)*delta_time;
       
    }
    else{
        f_speed = Math.max(f_speed-speed_change, 0);
        distance = f_speed/(60/1000)*delta_time;

    } 
    camera_x = camera_x+camera_direction[0]*distance;
    camera_z = camera_z+camera_direction[2]*distance;
    if(backword){
        b_speed = Math.min(b_speed+speed_change, player_speed);
        distance = b_speed/(60/1000)*delta_time;
    }
    else{
        b_speed = Math.max(b_speed-speed_change, 0);
        distance = b_speed/(60/1000)*delta_time;
    }
    camera_x = camera_x-camera_direction[0]*distance;
    camera_z = camera_z-camera_direction[2]*distance;
    if(right ){
        r_speed = Math.min(r_speed+speed_change, player_speed);
        distance = r_speed/(60/1000)*delta_time;
    }
    else{
        r_speed = Math.max(r_speed-speed_change, 0);
        distance = r_speed/(60/1000)*delta_time;
    }
    camera_x = camera_x-camera_direction[2]*distance;
    camera_z = camera_z+camera_direction[0]*distance;
    if(left ){
        l_speed = Math.min(l_speed+speed_change, player_speed);
        distance = l_speed/(60/1000)*delta_time;
    }
    else{
        l_speed = Math.max(l_speed-speed_change, 0);
        distance = l_speed/(60/1000)*delta_time;
    }
    camera_x = camera_x+camera_direction[2]*distance;
    camera_z = camera_z-camera_direction[0]*distance;
    //detect collision
    
   
    let margin = walls_thickness/2 + .18;
    if(current_cell.n == 1 ){
        camera_z = Math.max(camera_z,cell_center_z-maze_cell_size/2+margin);
    }
    if(current_cell.e ==1 ){
        camera_x = Math.min(camera_x,cell_center_x+maze_cell_size/2-margin);
    }
    if(current_cell.s ==1 ){
       camera_z = Math.min(camera_z,cell_center_z+maze_cell_size/2-margin);
    }
    if(current_cell.w ==1){
        camera_x = Math.max(camera_x,cell_center_x-maze_cell_size/2+margin);
    }
    //detect corners as well

    let horizontal_margin = Math.abs(camera_x - cell_center_x);
    let vertical_margin  = Math.abs(camera_z - cell_center_z);
    if(horizontal_margin > vertical_margin){
    if(camera_x > cell_center_x+maze_cell_size/2-margin || camera_x<cell_center_x-maze_cell_size/2+margin){
    camera_z = Math.min(camera_z,cell_center_z+maze_cell_size/2-margin);
    camera_z = Math.max(camera_z,cell_center_z-maze_cell_size/2+margin);
    
   }
    }
   else{
   
   if(camera_z < cell_center_z-maze_cell_size/2+margin || camera_z > cell_center_z+maze_cell_size/2-margin){
    camera_x = Math.max(camera_x,cell_center_x-maze_cell_size/2+margin);
    camera_x = Math.min(camera_x,cell_center_x+maze_cell_size/2-margin);
    
   }
}
    
    
    
    translation_view_mat = translate(camera_x,camera_y,camera_z);
    gl.uniform3fv(camera_position_location, [camera_x,camera_y,camera_z],false );
   
}
function update_view_angle(e){
    let rotate_y_axis = e.movementX;
    let rotate_x_axis = e.movementY;
    alpha = alpha - player_mouse_sensativity*rotate_y_axis;
beta = Math.max(Math.min(beta -  player_mouse_sensativity*rotate_x_axis,90),-90);

rotation_view_mat = mult(rotate(alpha,[0, 1, 0]),rotate(beta,[1, 0, 0]));
//rotate function converts to radians 
let rot_y = alpha*2*Math.PI/360;
let rot_x = beta*2*Math.PI/360;
   camera_direction = [-Math.sin(rot_y),Math.sin(rot_x),-Math.cos(rot_y)];
}


document.body.onload = init;