function main()
{
  var canvas = document.getElementById("xgl-canvas");
  var gl;
  var deltaX;
  var deltaY;

  var flag = true;

  var eyePosition = [ 0, 0, 2 ];

  // event handlers for mouse input (borrowed from "Learning WebGL" lesson 11)

  var mouseDown = false;
  var lastMouseX = null;
  var lastMouseY = null;
  var amortization=0.95;
  var moonRotationMatrix = mat4();

  function handleMouseDown(event) 
  {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }

  function handleMouseUp(event) 
  {
    mouseDown = false;
  }

  function handleMouseMove(event) 
  {
    if (!mouseDown) 
    {
      return;
    }
    
    var newX = event.clientX;
    var newY = event.clientY;
    deltaX = newX - lastMouseX;
    var newRotationMatrix = rotate(deltaX * amortization, 0, 1, 0);

    deltaY = newY - lastMouseY;
    newRotationMatrix = mult(rotate(deltaY * amortization, 1, 0, 0), newRotationMatrix);

    moonRotationMatrix = mult(newRotationMatrix, moonRotationMatrix);

    lastMouseX = newX
    lastMouseY = newY;
  }

  // event handlers for button clicks


  // ModelView and Projection matrices
  var modelingLoc, viewingLoc, projectionLoc,lightMatrixLoc;
  var modeling, viewing, projection;
  
  var numVertices  = 36;

  var pointsArray = [];
  var colorsArray = [];
  var normalsArray = [];
  var texCoordsArray = [];

  var texture;
  var texCoord = [
    vec2(0, 1),
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1)
  ];


  var vertices = [
    vec4( -0.5, -0.5,  0.05, 1 ),
    vec4( -0.5,  0.5,  0.05, 1 ),
    vec4(  0.5,  0.5,  0.05, 1 ),
    vec4(  0.5, -0.5,  0.05, 1 ),
    vec4( -0.5, -0.5, -0.05, 1 ),
    vec4( -0.5,  0.5, -0.05, 1 ),
    vec4(  0.5,  0.5, -0.05, 1 ),
    vec4(  0.5, -0.5, -0.05, 1 )
  ];

  // Using off-white cube for testing
  var vertexColors = [
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 ),  
    vec4( 1.0, 1.0, 1.0, 1.0 )
  ];

  var lightPosition = vec4( 0.0, 10.0, 20.0, 1.0 );
  var materialAmbient = vec4( 0.5, 0.5, 0.5, 1.0 );
  var materialDiffuse = vec4( 0.7, 0.7, 0.7, 1.0);
  var materialSpecular = vec4( 10.0, 10.0, 1.0, 1.0 );
  var materialShininess = 12.0;

  function quad(a, b, c, d) 
  {
     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);  // cross returns vec3
     var normal = vec4(normal);
     normal = normalize(normal);

    pointsArray.push(vertices[a]); 
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal); 
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[b]); 
    colorsArray.push(vertexColors[b]);
    normalsArray.push(normal); 
    texCoordsArray.push(texCoord[1]);
    pointsArray.push(vertices[c]); 
    colorsArray.push(vertexColors[c]);
    normalsArray.push(normal);   
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);  
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal); 
    texCoordsArray.push(texCoord[0]);
    pointsArray.push(vertices[c]); 
    colorsArray.push(vertexColors[c]);
    normalsArray.push(normal); 
    texCoordsArray.push(texCoord[2]);
    pointsArray.push(vertices[d]); 
    colorsArray.push(vertexColors[d]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[3]);
  }

  function colorCube()
  {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
  }
  
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl )
  { 
    alert( "WebGL isn't available" ); 
  }
  //
  //  Configure WebGL
  //
  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

  //  Load shaders and initialize attribute buffers

  var program = initShaders( gl, "xvertex-shader", "xfragment-shader" );
  gl.useProgram( program );

  // Generate pointsArray[], colorsArray[] and normalsArray[] from vertices[] and vertexColors[].
  // We don't use indices and ELEMENT_ARRAY_BUFFER (as in previous example)
  // because we need to assign different face normals to shared vertices.
  colorCube();

  // vertex array attribute buffer

  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  // color array atrribute buffer

  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  // normal array atrribute buffer

  var nBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

  var vNormal = gl.getAttribLocation( program, "vNormal" );
  gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vNormal );

  var tBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
  var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
  gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vTexCoord );

  var video = document.getElementById("bunny_video");

  var videoTexture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
  var refresh_texture = function() 
  {
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
  };
  gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

  // uniform variables in shaders
  modelingLoc   = gl.getUniformLocation(program, "modelingMatrix"); 
  viewingLoc    = gl.getUniformLocation(program, "viewingMatrix"); 
  projectionLoc = gl.getUniformLocation(program, "projectionMatrix");
  lightMatrixLoc= gl.getUniformLocation(program, "lightMatrix");  

  gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), 
     flatten(lightPosition) );
  gl.uniform4fv( gl.getUniformLocation(program, "materialAmbient"),
     flatten(materialAmbient));
  gl.uniform4fv( gl.getUniformLocation(program, "materialDiffuse"),
     flatten(materialDiffuse) );
  gl.uniform4fv( gl.getUniformLocation(program, "materialSpecular"), 
     flatten(materialSpecular) );        
  gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess);

  //event listeners for buttons 
  
  // event handlers for mouse input (borrowed from "Learning WebGL" lesson 11)
  canvas.onmousedown = handleMouseDown;
  document.onmouseup = handleMouseUp;
  document.onmousemove = handleMouseMove;
  var time_old=0, time_video=0;
  var x = 0;
  var y = 0;
  var z = 0;
  
  render(0);
  
  var flagTurn = 0;
  var flagStatus = 1;
  function render(time) 
  {
      var dT=(time-time_old)/1000;
      time_old=time;
      
      //========================   切換按鈕時要帥氣的轉一圈旋轉  =============================
      if(flagStatus != num)
      {
          flag = true;
      }

      if(flag)
      {
          modeling = mult(rotate(0,1,0,0),mult(rotate(flagTurn,0,1,0),rotate(0,0,0,1)));
          flagTurn += 50;
          if(flagTurn >= 360)
          {
            flag = false;flagTurn = 0;flagStatus = num;
            modeling = mult(rotate(0,1,0,0),mult(rotate(flagTurn,0,1,0),rotate(0,0,0,1)));
          }
      }
      //========================   END切換按鈕時要帥氣的轉一圈旋轉  ==========================
      

      //===========================滑鼠操作========================================
      

      if(mouseDown)
      {
        modeling = moonRotationMatrix;
      }
      
      //========================   END滑鼠操作=====================================

      viewing = lookAt(eyePosition, [0,0,0], [0,1,0]);

      projection = perspective(40, 1.0, 1.0, 3.0);
      
      gl.enable(gl.DEPTH_TEST);
      gl.uniformMatrix4fv( modelingLoc,   0, flatten(modeling) );
      gl.uniformMatrix4fv( viewingLoc,    0, flatten(viewing) );
      gl.uniformMatrix4fv( projectionLoc, 0, flatten(projection) );

      if (video.currentTime > 0 && video.currentTime!= time_video) 
      {
        time_video = video.currentTime;
        refresh_texture();
      }

      gl.drawArrays( gl.TRIANGLES, 0, numVertices );

      gl.flush();

      requestAnimFrame( render );
  }

}
