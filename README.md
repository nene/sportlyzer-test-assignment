�nnitlused, j�udsid test�lesannete tekstini!

## �lesanne 1:

https://dl.dropboxusercontent.com/u/9974252/sportlyzer_healthinfo.htm

Tegu on p�evase terviseinfo sisestamise vaatega.

Kuna sportlastel on soov seal rohkem v�ljasid kuvada ning erinevaid
slaidereid kasutada, siis on vaja sinna vaatesse nuppu/linki, mis
v�imaldaks erinevaid v�ljasid sisse ja v�lja l�litada. Modali sisu
v�ib v�ljade valimise vaate jaoks v�lja vahetada.

Test�lesande teostamiseks piisab, kui alguses n�ha olevaid v�ljasid
k�sitleda alguses sisse l�litatutena ning avanev UI laseks neid v�lja
ja tagasi sisse l�litada.

Kuna l�ppeesm�rk on ka antud valik salvestada, siis oleks vajalik ka
valitud v�ljade komplekti serverile edastamine (inline input v�li?
ajax salvestamine?).


## �lesanne 2:

https://dl.dropboxusercontent.com/u/9974252/sportlyzer_map.htm

Tegu on trenni detailinfo vaatega.

�levalpool on kiiruse ning k�rguse graafik, mis baseerub highcharts
mootori peal: http://api.highcharts.com/highcharts

Allpool on google maps kaardikomponent, mis kuvab l�bitud rada.

Informatiivsuse tarbeks oleks vaja, et �lemise graafiku peal hiirega
liikudes oleks v�imalik kaardi peale �igesse punkti tekitada
highlight/m�rge, et oleks v�imalik treeningu raskust (kiirus, pulss
jne) v�rrelda konkreetse asukohaga kaardil.

Highcharts v�imaldab hover/klikk evente kinni p��da ning eventi
siseselt on v�imalik teada saada punkti x koordinaati (ehk aega
millisekundites) ja selle j�rgi on v�imalik andmetest leida ka �ige
koordinaat.  Test�lesande teostamiseks piisab, kui hiire liigutamise
peale tekib all kaardi peal vabalt valitud marker �igesse kohta raja
peal.



HTML on otse laivist salvestatud, tegu reaalse frontend koodiga. Kui
vaja javascripti faile muuta, siis saab laivist alla t�mmata ja source
koodis panna sisse local pathi.

Dropbox paneb sunniviisiliselt htm kuvamisel charsetiks ascii,
mist�ttu t�pit�hed kuvavad veidralt.  Kokkupakituna �iges kodeeringus
faile on v�imalik alla t�mmata lingilt:
https://dl.dropboxusercontent.com/u/9974252/sportlyzer_frontend_js_tests.zip
