Õnnitlused, jõudsid testülesannete tekstini!

## Ülesanne 1:

https://dl.dropboxusercontent.com/u/9974252/sportlyzer_healthinfo.htm

Tegu on päevase terviseinfo sisestamise vaatega.

Kuna sportlastel on soov seal rohkem väljasid kuvada ning erinevaid
slaidereid kasutada, siis on vaja sinna vaatesse nuppu/linki, mis
võimaldaks erinevaid väljasid sisse ja välja lülitada. Modali sisu
võib väljade valimise vaate jaoks välja vahetada.

Testülesande teostamiseks piisab, kui alguses näha olevaid väljasid
käsitleda alguses sisse lülitatutena ning avanev UI laseks neid välja
ja tagasi sisse lülitada.

Kuna lõppeesmärk on ka antud valik salvestada, siis oleks vajalik ka
valitud väljade komplekti serverile edastamine (inline input väli?
ajax salvestamine?).


## Ülesanne 2:

https://dl.dropboxusercontent.com/u/9974252/sportlyzer_map.htm

Tegu on trenni detailinfo vaatega.

Ülevalpool on kiiruse ning kõrguse graafik, mis baseerub highcharts
mootori peal: http://api.highcharts.com/highcharts

Allpool on google maps kaardikomponent, mis kuvab läbitud rada.

Informatiivsuse tarbeks oleks vaja, et ülemise graafiku peal hiirega
liikudes oleks võimalik kaardi peale õigesse punkti tekitada
highlight/märge, et oleks võimalik treeningu raskust (kiirus, pulss
jne) võrrelda konkreetse asukohaga kaardil.

Highcharts võimaldab hover/klikk evente kinni püüda ning eventi
siseselt on võimalik teada saada punkti x koordinaati (ehk aega
millisekundites) ja selle järgi on võimalik andmetest leida ka õige
koordinaat.  Testülesande teostamiseks piisab, kui hiire liigutamise
peale tekib all kaardi peal vabalt valitud marker õigesse kohta raja
peal.



HTML on otse laivist salvestatud, tegu reaalse frontend koodiga. Kui
vaja javascripti faile muuta, siis saab laivist alla tõmmata ja source
koodis panna sisse local pathi.

Dropbox paneb sunniviisiliselt htm kuvamisel charsetiks ascii,
mistõttu täpitähed kuvavad veidralt.  Kokkupakituna õiges kodeeringus
faile on võimalik alla tõmmata lingilt:
https://dl.dropboxusercontent.com/u/9974252/sportlyzer_frontend_js_tests.zip
