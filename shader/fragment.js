const fragmentShader = `
#define PI 3.1415926535
uniform float iTime;
uniform vec2 iResolution;
uniform float iScale;
uniform vec2 iMouse;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

mat2 scale(vec2 scale){
    return mat2(scale.x,0.0,0.0,scale.y);
}
float sphere(vec3 p){
    return length(p)-1.;
}

float sinNoise(vec3 p){
    return 1.-(sin(p.x)+sin(p.y)+sin(p.z))/3.;
}
float scene(vec3 p){
    vec3 p1 = rotate(p,vec3(-1.,0.2,1.0),iTime*2.);
    float sphr = sphere(p1);
    float scale = 5. + 5.*sin(iTime);
    return max(sphr,(0.85-sinNoise(p1*scale))/scale);
}
vec3 getNormal(vec3 p){
    vec2 o = vec2(0.001,0.);
    return normalize(
        vec3(
            scene(p+o.xyy)-scene(p-o.xyy),
            scene(p+o.yxy)-scene(p-o.yxy),
            scene(p+o.yyx)-scene(p-o.yyx)
        )
    );
}
vec3 getColor(float amount){
    vec3 col = 0.5 + 0.5*cos(6.28318*(vec3(0.2,0.0,0.)+amount*vec3(1.0,1.0,0.5)));
    return col*amount;
}
vec3 getColorAmount(vec3 p){
    float amount = clamp((1.5-length(p))/2.,0.,1.);
    vec3 col = 0.5 + 0.5*cos(6.28318*(vec3(0.2,0.0,0.)+amount*vec3(1.0,1.0,0.5)));
    return col*amount;
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = (gl_FragCoord.xy*2.-iResolution.xy)/min(iResolution.x,iResolution.y);
    uv.x -= iMouse.x*0.5;
    uv.y -= iMouse.y*0.5;

    vec3 camPos = vec3(0.,0.,2.+sin(iScale));
    vec3 ray = normalize(vec3(uv,-1.));
    vec3 rayPos = camPos;
    float curDist = 0.;
    float rayLen = 0.;
    vec3 light = vec3(-1.,1.,1.);
    vec3 color = vec3(0.);

    for(int i = 0; i <= 64; i++){
        curDist = scene(rayPos);
        rayLen += .6*curDist;

        rayPos = camPos+ray*rayLen;
        if(abs(curDist)<0.001){
            vec3 n = getNormal(rayPos);
            float diff = dot(n,light);
            // color = getColor(diff);
            // color = getColor(length(rayPos));
            break;
        }
        color += 0.04*getColorAmount(rayPos);
    }

    fragColor = vec4(color,1.0);
    fragColor.g *= abs(iMouse.x)*0.6;
}
void main(){
    mainImage(gl_FragColor, gl_FragCoord.xy);
}`
export default fragmentShader;