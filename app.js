// Funcionalidad para la página de Lectura Guiada
document.addEventListener('DOMContentLoaded', function() {
    // Configurar endpoint del chat: auto-prod Render o localhost en dev
    if (!window.CHAT_API_URL) {
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        window.CHAT_API_URL = isLocal
            ? 'http://localhost:5050/api/chat'
            : 'https://ekggo.onrender.com/api/chat';
    }
    // Verificar si estamos en la página de lectura guiada
    const generarInformeBtn = document.getElementById('generarInforme');
    if (generarInformeBtn) {
        generarInformeBtn.addEventListener('click', generarInformeECG);
    }

    // Verificar si estamos en la página de comparación de patrones
    const tomarFotoBtn = document.getElementById('tomarFoto');
    if (tomarFotoBtn) {
        tomarFotoBtn.addEventListener('click', activarCamara);
        
        const ecgFile = document.getElementById('ecgFile');
        ecgFile.addEventListener('change', mostrarVistaPrevia);
        
        const subirImagenBtn = document.getElementById('subirImagen');
        subirImagenBtn.addEventListener('click', function() {
            document.getElementById('ecgFile').click();
        });
        
        const analizarECGBtn = document.getElementById('analizarECG');
        analizarECGBtn.addEventListener('click', analizarECG);
        
        const enviarChatGPTBtn = document.getElementById('enviarChatGPT');
        if (enviarChatGPTBtn) {
            enviarChatGPTBtn.addEventListener('click', enviarAChatGPT);
        }
        
        const buscarImagenesSimilaresBtn = document.getElementById('buscarImagenesSimilares');
        if (buscarImagenesSimilaresBtn) {
            buscarImagenesSimilaresBtn.addEventListener('click', buscarImagenesSimilares);
        }
        
        const guardarAnalisisPDFBtn = document.getElementById('guardarAnalisisPDF');
        if (guardarAnalisisPDFBtn) {
            guardarAnalisisPDFBtn.addEventListener('click', guardarAnalisisPDF);
        }
    }

    // Compatibilidad con la nueva versión de "Comparación de Patrones" (IDs V2)
    const ecgFileInput = document.getElementById('ecgFileInput');
    const btnCapturar = document.getElementById('btnCapturar');
    if (btnCapturar && ecgFileInput) {
        btnCapturar.addEventListener('click', capturarDesdeArchivoV2);

        const btnLimpiarCaptura = document.getElementById('btnLimpiarCaptura');
        if (btnLimpiarCaptura) btnLimpiarCaptura.addEventListener('click', limpiarCapturaV2);

        const btnAnalisisLocal = document.getElementById('btnAnalisisLocal');
        if (btnAnalisisLocal) btnAnalisisLocal.addEventListener('click', analizarECG_V2);

        const btnAnalisisChatGPT = document.getElementById('btnAnalisisChatGPT');
        if (btnAnalisisChatGPT) btnAnalisisChatGPT.addEventListener('click', enviarAChatGPT_V2);

        const btnAnalisisSimilares = document.getElementById('btnAnalisisSimilares');
        if (btnAnalisisSimilares) btnAnalisisSimilares.addEventListener('click', buscarImagenesSimilares_V2);

        const savePdfBtn = document.getElementById('savePdfBtn');
        if (savePdfBtn) savePdfBtn.addEventListener('click', guardarAnalisisPDF);
    }

    // Verificar si estamos en la página de copiar informe
    const copiarInformeBtn = document.getElementById('copiarInforme');
    if (copiarInformeBtn) {
        copiarInformeBtn.addEventListener('click', copiarInforme);
    }

    // Botón de limpiar formulario (Lectura Guiada)
    const limpiarFormularioBtn = document.getElementById('limpiarFormulario');
    if (limpiarFormularioBtn) {
        limpiarFormularioBtn.addEventListener('click', limpiarFormularioLG);
    }

    // Sospecha diagnóstica ECG
    const generarSospechaBtn = document.getElementById('generarSospecha');
    const copiarSospechaBtn = document.getElementById('copiarSospecha');
    if (generarSospechaBtn) generarSospechaBtn.addEventListener('click', generarSospechaECG);
    if (copiarSospechaBtn) copiarSospechaBtn.addEventListener('click', copiarSospecha);

    // Chat desplegable global (se muestra en todas las páginas)
    const toggle = document.createElement('button');
    toggle.className = 'chat-widget-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Chatea con la IA de EKG-LA');
    toggle.textContent = 'Chatea con la IA de EKG-LA';

    const panel = document.createElement('div');
    panel.className = 'chat-widget-panel';
    const iframe = document.createElement('iframe');
    iframe.src = 'chat.html';
    iframe.title = 'IA-EKG-LA';
    panel.appendChild(iframe);

    document.body.appendChild(toggle);
    document.body.appendChild(panel);
    toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
    });

    // Escucha mensajes desde el iframe del chat para minimizar/expandir panel
    window.addEventListener('message', (e) => {
        const data = e.data || {};
        if (data.type === 'chat:minimize') {
            panel.classList.remove('open');
        } else if (data.type === 'chat:expand') {
            panel.classList.add('open');
            // Se puede ajustar tamaño si fuese necesario
            // panel.style.maxWidth = '480px';
        } else if (data.type === 'chat:close') {
            panel.classList.remove('open');
        }
    });
});

// Función para generar el informe ECG
function generarInformeECG() {
    const bienTomado = document.getElementById('bienTomado').checked ? 'bien tomado' : 'con limitaciones técnicas';
    const ritmo = document.getElementById('ritmo').value || '';
    const frecuencia = document.getElementById('frecuencia').value || '';
    const eje = document.getElementById('eje').value || '';
    const pr = document.getElementById('pr').value || '';
    const ondaP = document.getElementById('ondaP').value || '';
    const qrs = document.getElementById('qrs').value || '';
    const st = document.getElementById('st').value || '';
    const ondaT = document.getElementById('ondaT').value || '';
    const ondaTLeads = Array.from(document.querySelectorAll('.lead-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.id.replace('lead_','').toUpperCase());
    const qt = document.getElementById('qt').value || '';
    const rrReg = !!document.getElementById('rr_regular')?.checked;
    const rrIrreg = !!document.getElementById('rr_irregular')?.checked;

    // Informe narrativo (tono clínico)
    const partes = [];
    partes.push(`Electrocardiograma ${bienTomado}.`);
    if (ritmo) {
        let ritmoTxt = `Ritmo ${ritmo.toLowerCase()}`;
        if (rrReg) ritmoTxt += ' con RR regular';
        else if (rrIrreg) ritmoTxt += ' con RR irregular';
        partes.push(ritmoTxt + '.');
    }
    if (frecuencia) partes.push(`Frecuencia ${frecuencia} lpm.`);
    if (eje) partes.push(`Eje ${eje.toLowerCase()}.`);
    if (pr) partes.push(`Intervalo PR ${pr} ms.`);
    if (ondaP) partes.push(`Onda P: ${ondaP}.`);
    if (qrs) partes.push(`Complejo QRS ${qrs} ms.`);
    const stLower = (st || '').toLowerCase();
    const stElevadoR = /elev/i.test(stLower);
    const stDescendidoR = /(desc|deprim)/i.test(stLower);
    const stAlterado = stElevadoR || stDescendidoR;
    const tLower = (ondaT || '').toLowerCase();
    const tAlterada = !!ondaT && !/normal/i.test(ondaT);
    if (st) {
        if (stAlterado) {
            if (ondaTLeads && ondaTLeads.length) {
                partes.push(`Segmento ST ${stLower} en derivaciones ${ondaTLeads.join(', ')}.`);
            } else {
                partes.push(`Segmento ST ${stLower}.`);
            }
        } else {
            partes.push(`Segmento ST ${stLower}.`);
        }
    }
    if (!stAlterado && ondaT) {
        if (tAlterada && ondaTLeads && ondaTLeads.length) {
            partes.push(`Onda T ${tLower} en derivaciones ${ondaTLeads.join(', ')}.`);
        } else {
            partes.push(`Onda T ${tLower}.`);
        }
    }
    if (qt) partes.push(`Intervalo QT: ${qt.toLowerCase()}.`);
    // Campo de alteraciones adicionales retirado: no se agrega al informe

    const informeNarrativo = partes.join(' ');
    const informeEl = document.getElementById('informeECG');
    informeEl.textContent = informeNarrativo;
    informeEl.classList.remove('informe-flash');
    void informeEl.offsetWidth;
    informeEl.classList.add('informe-flash');

    // Generar automáticamente la sospecha al crear el informe
    generarSospechaECG();
    // En escritorio subir al inicio para ver resultado. En móvil no hacer scroll.
    if (window.innerWidth >= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Función para copiar el informe al portapapeles
function copiarInforme() {
    const informeTexto = document.getElementById('informeECG').textContent;
    navigator.clipboard.writeText(informeTexto)
        .then(() => {
            alert('Informe copiado al portapapeles');
        })
        .catch(err => {
            console.error('Error al copiar: ', err);
            alert('No se pudo copiar el informe');
        });
}

// Lógica rule-based para sospecha diagnóstica ECG (alineada al esquema proporcionado)
function generarSospechaECG() {
    const ritmo = (document.getElementById('ritmo')?.value || '').toLowerCase();
    const frecuencia = parseFloat(document.getElementById('frecuencia')?.value);
    const eje = (document.getElementById('eje')?.value || '').toLowerCase();
    const pr = parseFloat(document.getElementById('pr')?.value);
    const qrs = parseFloat(document.getElementById('qrs')?.value);
    const stText = (document.getElementById('st')?.value || '').toLowerCase();
    const ondaTText = (document.getElementById('ondaT')?.value || '').toLowerCase();
    const ondaPText = (document.getElementById('ondaP')?.value || '').toLowerCase();
    const rrRegular = !!document.getElementById('rr_regular')?.checked;
    const rrIrregular = !!document.getElementById('rr_irregular')?.checked;
    const ondasFSierra = !!document.getElementById('ondas_f_sierra')?.checked;
    const leadsSel = Array.from(document.querySelectorAll('.lead-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.id.replace('lead_','').toUpperCase());
    
    const has = (id) => !!document.getElementById(id)?.checked;

    // Normalizar palabras clave
    const stElevado = /elev/i.test(stText);
    const stDescendido = /(desc|deprim)/i.test(stText);
    const tInvertida = /invertid/i.test(ondaTText);
    const tPicuda = /(picud|punta|aguda)/i.test(ondaTText);
    const tAplanada = /(aplan|plana)/i.test(ondaTText);

    // Motor de puntuación para diferenciales
    const picks = [];
    const addPick = (name, score, reason) => picks.push({ name, score, reason });
    let comentario = '';
    const comentarioItems = [];

    // Territorios confirmados SOLO si se marcan TODAS sus derivaciones
    const territoryMap = {
        'inferior': ['DII', 'DIII', 'AVF'],
        'lateral alta': ['DI', 'AVL'],
        'lateral baja': ['V5', 'V6'],
        'anterior': ['V3', 'V4'],
        'septal': ['V1', 'V2'],
        'anteroseptal': ['V1', 'V2', 'V3', 'V4'],
        'lateral extenso': ['DI', 'AVL', 'V5', 'V6']
    };
    const territoriesConfirmed = [];
    const territoryConfirmedDetails = [];
    Object.entries(territoryMap).forEach(([terr, leads]) => {
        const allPresent = leads.every(l => leadsSel.includes(l));
        if (allPresent) {
            territoriesConfirmed.push(terr);
            territoryConfirmedDetails.push(`${terr} (${leads.join(', ')})`);
        }
    });
    const hasLatAlta = territoriesConfirmed.includes('lateral alta');
    const hasLatBaja = territoriesConfirmed.includes('lateral baja');
    const hasLatExtenso = hasLatAlta && hasLatBaja;
    const hasAnteroSeptal = territoriesConfirmed.includes('anteroseptal');
    const territoriesForDx = territoriesConfirmed.filter(t => {
        if (hasAnteroSeptal && (t === 'anterior' || t === 'septal')) return false;
        if (hasLatExtenso && (t === 'lateral alta' || t === 'lateral baja' || t === 'lateral extenso')) return false;
        return true;
    });

    const arteryFor = (terr) => {
        if (terr === 'septal' || terr === 'anterior' || terr === 'anteroseptal') return 'Arteria Descendente Anterior (ADA)';
        if (terr === 'lateral alta') return 'Arteria Circunfleja o rama Diagonal';
        if (terr === 'lateral baja' || terr === 'lateral extenso') return 'Arteria Circunfleja o ADA';
        if (terr === 'inferior') return 'Arteria Coronaria Derecha (CD) (80%) o Circunfleja (20%)';
        return '';
    };
    const faceFor = (terr) => {
        const hasAnterior = territoriesConfirmed.includes('anterior');
        if (hasAnterior && (hasLatAlta || hasLatBaja || hasLatExtenso)) return 'anterolateral';
        if (terr === 'lateral extenso') return 'lateral extensa';
        if (terr === 'anteroseptal') return 'anteroseptal';
        return terr;
    };

    // Isquemia/lesión
    if (stElevado) {
        if (territoriesForDx.length) territoriesForDx.forEach(t => {
            const leads = territoryMap[t] ? territoryMap[t].join(', ') : '';
            const suffix = leads ? ` (${leads})` : '';
            addPick(`Infarto con elevación del ST (STEMI) de cara ${faceFor(t)}`, 5, `ST elevado en territorio ${t}${suffix}`);
        });
        if (hasLatExtenso) addPick('Infarto lateral extenso (STEMI)', 5, 'ST elevado en territorio lateral extenso');
        if (!territoriesForDx.length && !hasLatExtenso) addPick('Infarto con elevación del ST (STEMI)', 5, 'Elevación del ST');
    }
    if (stDescendido) {
        if (territoriesForDx.length) territoriesForDx.forEach(t => {
            const leads = territoryMap[t] ? territoryMap[t].join(', ') : '';
            const suffix = leads ? ` (${leads})` : '';
            addPick(`Infarto agudo del miocardio sin elevación del ST (NSTEMI) de cara ${faceFor(t)}`, 3, `ST descendido en territorio ${t}${suffix}`);
        });
        if (hasLatExtenso) addPick('Infarto lateral extenso sin elevación del ST (NSTEMI)', 3, 'ST descendido en territorio lateral extenso');
        if (!territoriesForDx.length && !hasLatExtenso) addPick('Infarto agudo del miocardio sin elevación del ST (NSTEMI)', 3, 'Descenso del ST');
    }
    if (tInvertida) {
        if (territoriesForDx.length) territoriesForDx.forEach(t => {
            const leads = territoryMap[t] ? territoryMap[t].join(', ') : '';
            const suffix = leads ? ` (${leads})` : '';
            addPick(`Infarto agudo del miocardio sin elevación del ST (NSTEMI) de cara ${faceFor(t)}`, 3, `T invertida en territorio ${t}${suffix}`);
        });
        if (hasLatExtenso) addPick('Infarto lateral extenso sin elevación del ST (NSTEMI)', 3, 'T invertida en territorio lateral extenso');
        if (!territoriesForDx.length && !hasLatExtenso) addPick('Infarto agudo del miocardio sin elevación del ST (NSTEMI)', 3, 'T invertida');
    }

    // Arritmias
    if (ritmo.includes('no sinusal')) {
        // Utilidad: RR irregular favorece FA; RR regular favorece Flutter/TSV
        if (rrIrregular) {
            let scoreFA = 5;
            let reasonFA = 'No sinusal, RR irregular';
            if (/ausent/.test(ondaPText)) { scoreFA += 1; reasonFA += ', onda P ausente'; }
            let faLabel = 'Fibrilación auricular (FA) probable';
            if (!isNaN(frecuencia)) {
                if (frecuencia < 100) faLabel = 'Fibrilación auricular (FA) probable — respuesta ventricular controlada';
                else if (frecuencia > 100) faLabel = 'Fibrilación auricular (FA) probable — respuesta ventricular rápida';
            }
            addPick(faLabel, scoreFA, reasonFA);
        }
        if (rrRegular) {
            // Flutter altamente priorizado si hay ondas F (sierra)
            if (ondasFSierra) {
                let scoreFl = 5;
                let reasonFl = 'No sinusal, RR regular, ondas F (sierra)';
                if (!isNaN(frecuencia) && frecuencia >= 140 && frecuencia <= 170 && !isNaN(qrs) && qrs < 120) {
                    scoreFl += 1; reasonFl += ', FC ~150, QRS estrecho';
                }
                addPick('Flutter auricular probable', scoreFl, reasonFl);
            } else {
                // Sin ondas F, aún considerar Flutter por FC ~150 con QRS estrecho
                if (!isNaN(frecuencia) && frecuencia >= 140 && frecuencia <= 170 && !isNaN(qrs) && qrs < 120) {
                    addPick('Flutter auricular probable', 4, 'No sinusal, RR regular, FC ~150 lpm, QRS estrecho');
                }
            }
        }

        // TSV: criterios flexibles y umbral de FC ≥150
        // Suma puntos por: No sinusal, RR regular, FC ≥150, QRS <120, onda P ausente (oculta)
        const tsvCriteria = [];
        let tsvScore = 0;
        if (ritmo.includes('no sinusal')) { tsvScore++; tsvCriteria.push('No sinusal'); }
        if (rrRegular) { tsvScore++; tsvCriteria.push('RR regular'); }
        const hrHighTSV = (!isNaN(frecuencia) && frecuencia > 140);
        if (hrHighTSV) { tsvScore++; tsvCriteria.push('FC >140 lpm'); }
        if (!isNaN(qrs) && qrs < 120) { tsvScore++; tsvCriteria.push('QRS estrecho (<120 ms)'); }
        if (/ausent/.test(ondaPText)) { tsvScore++; tsvCriteria.push('Onda P oculta/ausente'); }
        if (hrHighTSV && tsvScore >= 2) {
            const scoreTSV = 4 + Math.min(tsvScore - 2, 2); // base 4, +1 o +2 según criterios extra
            addPick('Taquicardia supraventricular (TSV) probable', scoreTSV, tsvCriteria.join(', '));
        }
        // Fallback heurístico si no se marcó RR
        if (!rrRegular && !rrIrregular) {
            if (/ausent/.test(ondaPText)) {
                let faLabel = 'Fibrilación auricular (FA) probable';
                if (!isNaN(frecuencia)) {
                    if (frecuencia < 100) faLabel = 'Fibrilación auricular (FA) probable — respuesta ventricular controlada';
                    else if (frecuencia > 100) faLabel = 'Fibrilación auricular (FA) probable — respuesta ventricular rápida';
                }
                addPick(faLabel, 4, 'No sinusal, onda P ausente');
            }
            if (!isNaN(frecuencia) && frecuencia >= 140 && frecuencia <= 170 && !isNaN(qrs) && qrs < 120) {
                addPick('Flutter auricular probable', 3, 'No sinusal, FC ~150 lpm, QRS estrecho');
            }
            // TSV ya evaluada mediante puntuación flexible
        }
    }
    // TV heuristic: QRS ancho + FC elevada + no sinusal
    if (!isNaN(qrs) && qrs >= 120 && (!isNaN(frecuencia) && frecuencia >= 120) && ritmo.includes('no sinusal')) {
        addPick('Taquicardia ventricular (TV) probable', 5, 'QRS ≥120 ms, FC ≥120 lpm, no sinusal');
    }
    const ritmoSinusal = ritmo === 'sinusal';
    if (ritmoSinusal && !isNaN(frecuencia) && frecuencia < 60) {
        const prOk = (isNaN(pr) || pr <= 200);
        const noBAV = !has('crit_disociacion_av') && !has('crit_pr_progresivo') && !has('crit_pr_constante');
        if (prOk && noBAV) {
            addPick('Bradicardia sinusal', 2, 'Sinusal con FC <60 lpm');
        }
    }

    // Taquicardia sinusal: solo si no hay TSV/TV/FA rápida
    if (ritmoSinusal && !isNaN(frecuencia) && frecuencia > 100) {
        const hasTSV = picks.some(p => /taquicardia\s+supraventricular/i.test(p.name));
        const hasTV = picks.some(p => /taquicardia\s+ventricular/i.test(p.name));
        const hasFARapida = picks.some(p => /fibrilaci[óo]n\s+auricular[\s\S]*r[áa]pida/i.test(p.name));
        if (!hasTSV && !hasTV && !hasFARapida) {
            addPick('Taquicardia sinusal', 2, 'Sinusal con FC >100 lpm');
        }
    }

    // Bloqueos
    if (!isNaN(pr) && pr > 200) addPick('Bloqueo AV de primer grado', 3, 'PR >200 ms');
    // Preexcitación automática por PR corto (User request)
    if (!isNaN(pr) && pr < 120 && pr > 0) addPick('Síndrome de Preexcitación', 5, 'PR corto (<120 ms)');

    if (!isNaN(qrs) && qrs >= 120 && !stElevado) {
        if (eje.includes('izquierda')) addPick('Bloqueo de rama izquierda (BRI) probable', 3, 'QRS ancho con eje izquierdo');
        else if (eje.includes('derecha')) addPick('Bloqueo de rama derecha (BRD) probable', 3, 'QRS ancho con eje derecho');
        else addPick('Bloqueo de rama (QRS ≥120 ms)', 2, 'QRS ancho');
    }

    // Electrolitos
    if (tPicuda) addPick('Hiperkalemia probable', 4, 'T picudas');
    if (!isNaN(pr) && pr > 200) addPick('Hiperkalemia probable', 1, 'PR prolongado');
    if (!isNaN(qrs) && qrs >= 120) addPick('Hiperkalemia probable', 1, 'QRS ancho');
    if (tAplanada) addPick('Hipokalemia probable', 3, 'T aplanada');
    if (stDescendido) addPick('Hipokalemia probable', 1, 'ST descendido');
    // Pericarditis: ST difuso y/o PR deprimido
    if (has('crit_st_difuso')) addPick('Pericarditis aguda probable', 4, 'ST elevado difuso');
    if (has('crit_pr_deprimido')) addPick('Pericarditis aguda probable', 3, 'PR deprimido');
    // Onda U por checkbox
    if (has('crit_onda_u')) addPick('Hipokalemia probable', 3, 'Onda U');

    // QT por selección (lista desplegable)
    const qtSelSos = (document.getElementById('qt')?.value || '').toLowerCase();
    if (/prolong/.test(qtSelSos)) addPick('QT prolongado (valorar QTc y riesgo de torsades)', 3, 'QT prolongado');
    if (/cort/.test(qtSelSos)) addPick('QT corto (valorar causas y electrolitos)', 2, 'QT corto');

    // WPW y AV blocks por checkboxes
    if (has('crit_pr_corto')) addPick('Síndrome de Preexcitación', 4, 'PR corto');
    if (has('crit_onda_delta')) addPick('Síndrome de Wolff-Parkinson-White (WPW)', 5, 'Onda delta');
    if (has('crit_pr_progresivo')) addPick('Bloqueo AV de segundo grado — Mobitz I (Wenckebach) probable', 4, 'PR progresivo con P no conducida');
    if (has('crit_pr_constante')) addPick('Bloqueo AV de segundo grado — Mobitz II probable', 4, 'PR constante con P no conducida');
    if (has('crit_disociacion_av')) addPick('Bloqueo AV completo (3er grado)', 5, 'Disociación AV');

    // Checkboxes opcionales (sumar puntuación y razones)
    if (has('crit_rsr_v1')) addPick('Bloqueo de rama derecha (BRD) probable', 4, "rSR' en V1");
    if (has('crit_s_ancha_i_v6')) addPick('Bloqueo de rama derecha (BRD) probable', 2, 'S ancha en I/V6');
    if (has('crit_r_empastada_v5_v6')) addPick('Bloqueo de rama izquierda (BRI) probable', 4, 'R empastada en V5–V6');
    if (has('crit_sin_q_i_v6')) addPick('Bloqueo de rama izquierda (BRI) probable', 3, 'Sin q en I/V6');
    if (has('crit_notch_75_i')) addPick('Bloqueo de rama izquierda (BRI) probable', 3, 'Notch >75 ms en I');
    if (has('crit_v1_qs_rs')) addPick('Bloqueo de rama derecha (BRD) probable', 2, 'V1 QS/rS');
    if (has('crit_v6_r_ancha')) addPick('Bloqueo de rama izquierda (BRI) probable', 2, 'V6 R alta ancha');
    if (has('crit_qrs_ancho')) addPick('Bloqueo de rama (QRS ≥120 ms)', 2, 'QRS ancho');
    if (has('crit_disociacion_av')) addPick('Bloqueo AV completo (3er grado)', 5, 'Disociación AV');
    if (has('crit_pr_progresivo')) addPick('Bloqueo AV de segundo grado — Mobitz I (Wenckebach) probable', 4, 'PR progresivo con P no conducida');
    if (has('crit_pr_constante')) addPick('Bloqueo AV de segundo grado — Mobitz II probable', 4, 'PR constante con P no conducida');
    if (has('crit_capturas_ventriculares')) addPick('Taquicardia ventricular (TV) probable', 4, 'Capturas ventriculares');
    if (has('crit_fusion')) addPick('Taquicardia ventricular (TV) probable', 4, 'Latidos de fusión');
    if (has('crit_concordancia_precordial')) addPick('Taquicardia ventricular (TV) probable', 3, 'Concordancia precordial');
    if (has('crit_brugada')) addPick('Síndrome de Brugada (patrón tipo 1/2)', 3, 'Elevación ST V1–V3');
    if (has('crit_wellens')) addPick('Signo de Wellens (estenosis DA)', 3, 'T negativa profunda V2–V3');
    if (has('crit_st_dep_global')) addPick('Infarto agudo del miocardio sin elevación del ST (NSTEMI)', 3, 'ST descendido global');
    if (has('crit_hvi')) addPick('Hipertrofia ventricular izquierda (HVI)', 2, 'Voltaje alto (Sokolow-Lyon)');
    // crit_onda_delta ya manejado arriba para WPW completo
    if (has('crit_st_concordante_bri')) addPick('Infarto con elevación del ST (STEMI)', 5, 'ST concordante en BRI');
    if (has('crit_st_discordante_bri')) addPick('Infarto con elevación del ST (STEMI)', 4, 'ST discordante excesivo en BRI');
    if (has('crit_qr_v1_qs_v1v2')) addPick('Infarto anteroseptal probable', 3, 'qR en V1 o QS en V1–V2');
    if (has('crit_onda_u')) addPick('Hipokalemia probable', 3, 'Onda U');
    if (has('crit_t_picuda')) addPick('Hiperkalemia probable', 4, 'T picuda');
    if (has('crit_qtc_prolongado')) addPick('QT prolongado (valorar QTc y riesgo de torsades)', 3, 'QTc prolongado');

    // Territorios (añadir al comentario)
    // Añadir criterio territorial explícito basado en derivaciones
    if (territoryConfirmedDetails.length) {
        const enriched = territoriesConfirmed.map(t => {
            const leads = territoryMap[t].join(', ');
            const art = arteryFor(t);
            return `${t} (${leads})${art ? ' — ' + art : ''}`;
        }).join(', ');
        comentarioItems.push('Territorios confirmados por derivaciones: ' + enriched + '.');
    }

    // Mapeo morfológico desde "alteraciones" a criterios (Comparación de Patrones)
    // Texto libre retirado: la sospecha se nutre de variables guiadas y criterios morfológicos

    // Selección top 2 por puntuación
    const byScore = {};
    picks.forEach(p => { byScore[p.name] = (byScore[p.name] || 0) + p.score; });
    const sorted = Object.entries(byScore).sort((a,b) => b[1]-a[1]).map(([name]) => name);
    const nonQt = sorted.filter(n => !/QT\s+(prolongado|corto)/i.test(n));
    const qtOnly = sorted.filter(n => /QT\s+(prolongado|corto)/i.test(n));
    const ordered = nonQt.length ? nonQt.concat(qtOnly) : sorted;
    const top = (ordered.length ? ordered.slice(0, 3) : ['ECG sin hallazgos concluyentes']);

    const fraseCorrelacion = 'Correlacionar con historia clínica.';
    comentarioItems.push(fraseCorrelacion);
    comentario = comentarioItems.join(' ');

    const resultado = { diagnostico_sugerido: top.join('; '), comentario };

    const cont = document.getElementById('resultadoSospecha');
    if (cont) {
        cont.classList.remove('d-none', 'alert-danger');
        cont.classList.add('alert-info');
        const listHtml = comentarioItems.length ? ('<ul class="mb-0 ps-3">' + comentarioItems.map(i => '<li>' + i + '</li>').join('') + '</ul>') : '';
        cont.innerHTML = '<strong>Diagnóstico sugerido:</strong> ' + resultado.diagnostico_sugerido + (listHtml ? '<br><strong>Comentario:</strong> ' + listHtml : '');
    }

    // --- Lógica para "Hallazgos anormales/Sugerencias" ---
    const hallazgos = [];
    
    // 1. Ritmo
    if (ritmo.includes('no sinusal')) {
        hallazgos.push({
            hallazgo: 'Ritmo no sinusal',
            desc: 'Un ritmo no sinusal implica que el impulso no se origina en el nodo sinusal o que la conducción es anormal.',
            causas: [
                'Fibrilación auricular (actividad caótica, ausencia de P)',
                'Flutter auricular (ondas F en dientes de sierra)',
                'Taquicardia supraventricular (TSV) (QRS estrecho, regular)',
                'Ritmo de la unión (nodal) (P ausente o invertida)',
                'Ritmo ventricular (QRS ancho, disociación AV)'
            ]
        });
    }

    // 2. Frecuencia Cardíaca
    if (!isNaN(frecuencia)) {
        if (frecuencia < 60) {
            hallazgos.push({
                hallazgo: 'Bradicardia (<60 lpm)',
                desc: 'Frecuencia cardíaca baja que puede ser fisiológica o patológica.',
                causas: [
                    'Enfermedad del nodo sinusal',
                    'Bloqueos AV de alto grado',
                    'Hipotiroidismo / Hipotermia',
                    'Fármacos (betabloqueadores, digoxina)',
                    'Vagotonía (fisiológica en atletas)'
                ]
            });
        } else if (frecuencia > 100) {
            hallazgos.push({
                hallazgo: 'Taquicardia (>100 lpm)',
                desc: 'Frecuencia cardíaca elevada por aumento de automatismo o reentrada.',
                causas: [
                    'Fiebre / Sepsis / Dolor',
                    'Hipovolemia o anemia',
                    'Arritmias supraventriculares / ventriculares',
                    'Hipertiroidismo',
                    'Isquemia miocárdica / Insuficiencia cardíaca'
                ]
            });
        }
    }

    // 3. Eje Cardíaco
    if (eje.includes('izquierda')) {
        hallazgos.push({
            hallazgo: 'Desviación del eje a la izquierda',
            desc: 'Eje eléctrico desviado hacia -30° o más negativo.',
            causas: [
                'Hipertrofia ventricular izquierda',
                'Bloqueo fascicular anterior izquierdo',
                'Infarto inferior',
                'Miocardiopatía dilatada',
                'Hipertensión arterial crónica'
            ]
        });
    } else if (eje.includes('derecha')) {
        hallazgos.push({
            hallazgo: 'Desviación del eje a la derecha',
            desc: 'Eje eléctrico desviado hacia +90° o más positivo.',
            causas: [
                'Hipertrofia ventricular derecha',
                'Embolia pulmonar',
                'EPOC / Cor pulmonale',
                'Bloqueo fascicular posterior',
                'Cardiopatías congénitas (ej. CIA)'
            ]
        });
    }

    // 4. Intervalo PR
    if (!isNaN(pr)) {
        if (pr > 200) {
            hallazgos.push({
                hallazgo: 'PR prolongado (>200 ms)',
                desc: 'Retraso en la conducción auriculo-ventricular.',
                causas: [
                    'Bloqueo AV de primer grado',
                    'Isquemia del nodo AV',
                    'Fármacos (betabloqueadores, calcioantagonistas)',
                    'Enfermedad degenerativa de conducción',
                    'Hiperkalemia'
                ]
            });
        } else if (pr < 120 && pr > 0) {
            hallazgos.push({
                hallazgo: 'PR corto (<120 ms)',
                desc: 'Conducción acelerada o bypass del nodo AV.',
                causas: [
                    'Síndrome de Wolff-Parkinson-White (WPW)',
                    'Síndrome de Lown-Ganong-Levine',
                    'Ritmos de la unión (nodal)',
                    'Taquicardias por reentrada',
                    'Estimulación auricular ectópica'
                ]
            });
        }
    }

    // 5. Onda P
    if (ondaPText.includes('duración') || /mitral/i.test(ondaPText)) {
        hallazgos.push({
            hallazgo: 'P mitral (ancha y mellada)',
            desc: 'Sugiere crecimiento de la aurícula izquierda.',
            causas: [
                'Estenosis mitral',
                'Insuficiencia mitral',
                'Hipertensión arterial crónica',
                'Miocardiopatía dilatada',
                'Sobrecarga auricular izquierda'
            ]
        });
    }
    if (ondaPText.includes('voltaje') || /pulmonar/i.test(ondaPText)) {
        hallazgos.push({
            hallazgo: 'P pulmonar (alta y picuda)',
            desc: 'Sugiere crecimiento de la aurícula derecha.',
            causas: [
                'EPOC / Enfermedad pulmonar crónica',
                'Hipertensión pulmonar',
                'Embolia pulmonar',
                'Estenosis tricuspídea',
                'Cardiopatía congénita (ej. estenosis pulmonar)'
            ]
        });
    }
    if (ondaPText.includes('ausente')) {
        hallazgos.push({
            hallazgo: 'Onda P ausente',
            desc: 'Falta de actividad auricular organizada visible.',
            causas: [
                'Fibrilación auricular',
                'Flutter auricular (ondas F sustituyen P)',
                'Ritmo nodal (P retrógrada u oculta)',
                'Taquicardia ventricular',
                'Paro auricular / Hiperkalemia severa'
            ]
        });
    }

    // 6. Complejo QRS
    if (!isNaN(qrs)) {
        if (qrs >= 120) {
            hallazgos.push({
                hallazgo: 'QRS ancho (≥120 ms)',
                desc: 'Retraso en la conducción intraventricular.',
                causas: [
                    'Bloqueo de rama derecha (BRD)',
                    'Bloqueo de rama izquierda (BRI)',
                    'Ritmo ventricular / Extrasístoles ventriculares',
                    'Hiperkalemia severa',
                    'Síndrome de preexcitación (WPW)'
                ]
            });
        }
    }
    // Nota: QRS bajo voltaje no tiene input directo numérico de amplitud en este form, se omite salvo inferencia.

    // 7. Segmento ST
    if (stElevado) {
        hallazgos.push({
            hallazgo: 'Elevación del segmento ST',
            desc: 'Lesión miocárdica aguda o repolarización anormal.',
            causas: [
                'Infarto agudo de miocardio (STEMI)',
                'Pericarditis aguda (elevación difusa, PR descendido)',
                'Repolarización precoz (benigno)',
                'Aneurisma ventricular (persistente)',
                'Espasmo coronario (Angina de Prinzmetal)'
            ]
        });
    } else if (stDescendido) {
        hallazgos.push({
            hallazgo: 'Depresión del segmento ST',
            desc: 'Isquemia subendocárdica o sobrecarga.',
            causas: [
                'Isquemia subendocárdica (NSTEMI / Angina)',
                'Sobrecarga ventricular (Strain)',
                'Efecto digitálico (cubeta)',
                'Hipokalemia',
                'Cambios recíprocos de infarto'
            ]
        });
    }

    // 8. Onda T
    if (tInvertida) {
        hallazgos.push({
            hallazgo: 'Onda T invertida',
            desc: 'Alteración de la repolarización, posible isquemia.',
            causas: [
                'Isquemia miocárdica',
                'Infarto previo / evolutivo',
                'Sobrecarga ventricular / Hipertrofia',
                'Embolia pulmonar (S1Q3T3)',
                'Patrón juvenil persistente (variante normal)'
            ]
        });
    } else if (tPicuda) {
        hallazgos.push({
            hallazgo: 'Onda T picuda',
            desc: 'Repolarización acelerada o alteración electrolítica.',
            causas: [
                'Hiperkalemia (típico: base estrecha)',
                'Isquemia temprana (fase hiperaguda)',
                'Acidosis metabólica',
                'Insuficiencia renal',
                'Lisis celular masiva (rabdomiólisis)'
            ]
        });
    } else if (tAplanada) {
        hallazgos.push({
            hallazgo: 'Onda T aplanada',
            desc: 'Aplanamiento de la onda de repolarización.',
            causas: [
                'Hipokalemia',
                'Isquemia crónica / no transmural',
                'Hipomagnesemia',
                'Hipotiroidismo',
                'Efecto farmacológico'
            ]
        });
    }

    // 9. Intervalo QT
    const qtVal = (document.getElementById('qt')?.value || '').toLowerCase();
    if (qtVal.includes('prolongado')) {
        hallazgos.push({
            hallazgo: 'QT prolongado',
            desc: 'Retraso en la repolarización ventricular (riesgo Torsades).',
            causas: [
                'Hipokalemia / Hipomagnesemia / Hipocalcemia',
                'Fármacos (antiarrítmicos, psicotrópicos, antibióticos)',
                'Síndrome de QT largo congénito',
                'Isquemia miocárdica',
                'Bradicardia severa'
            ]
        });
    } else if (qtVal.includes('corto')) {
        hallazgos.push({
            hallazgo: 'QT corto',
            desc: 'Repolarización ventricular acelerada.',
            causas: [
                'Hipercalcemia',
                'Hiperkalemia',
                'Síndrome de QT corto congénito',
                'Acidosis',
                'Efecto digitálico'
            ]
        });
    }

    // Renderizar Hallazgos
    const hallazgosCont = document.getElementById('resultadoHallazgos');
    const copiarHallazgosBtn = document.getElementById('copiarHallazgos');
    
    if (hallazgosCont) {
        if (hallazgos.length > 0) {
            hallazgosCont.classList.remove('d-none');
            const html = hallazgos.map(h => {
                const listaCausas = h.causas.map(c => `<li>${c}</li>`).join('');
                return `
                    <div class="mb-3">
                        <strong>${h.hallazgo}</strong><br>
                        <small class="text-muted">${h.desc} — Indagar posibilidad de:</small>
                        <ul class="mb-0 mt-1 ps-3">
                            ${listaCausas}
                        </ul>
                    </div>
                `;
            }).join('<hr class="my-2">');
            hallazgosCont.innerHTML = html;
        } else {
            hallazgosCont.classList.add('d-none');
            hallazgosCont.innerHTML = '';
        }
    }

    if (copiarHallazgosBtn) {
        // Recrear listener para evitar duplicados
        const newBtn = copiarHallazgosBtn.cloneNode(true);
        copiarHallazgosBtn.parentNode.replaceChild(newBtn, copiarHallazgosBtn);
        newBtn.addEventListener('click', () => {
            if (!hallazgos.length) return;
            const text = hallazgos.map(h => {
                return `${h.hallazgo}\n${h.desc} — Indagar posibilidad de:\n` + h.causas.map((c, i) => `${i+1}. ${c}`).join('\n');
            }).join('\n\n');
            navigator.clipboard.writeText(text)
                .then(() => alert('Hallazgos copiados al portapapeles'))
                .catch(() => alert('No se pudo copiar'));
        });
    }

    // Imagen ilustrativa del primer diagnóstico sugerido
    const imgCont = document.getElementById('sospechaImagen');
    if (imgCont) {
        imgCont.innerHTML = '';
        const primary = ordered[0] || '';
        const entry = ecgImagesMap.find(e => e.match.test(primary));
        if (entry) {
            const html = `<img src="${entry.src}" alt="${entry.alt}" class="img-fluid rounded">`;
            imgCont.innerHTML = html;
        }
    }
    const critEl = document.getElementById('criteriosDetectados');
    if (critEl) {
        // Agrupar razones por diagnóstico para mostrarlas separadas
        const reasonsByDx = {};
        picks.forEach(p => {
            if (!p || !p.name) return;
            const reason = (p.reason || '').trim();
            if (!reason) return;
            if (!reasonsByDx[p.name]) reasonsByDx[p.name] = new Set();
            reasonsByDx[p.name].add(reason);
        });

        const orderedDxNames = [];
        if (ordered && Array.isArray(ordered)) {
            ordered.forEach(name => {
                if (reasonsByDx[name]) orderedDxNames.push(name);
            });
        }
        // Incluir cualquier diagnóstico con razones que no estuviera en 'sorted'
        Object.keys(reasonsByDx).forEach(name => {
            if (!orderedDxNames.includes(name)) orderedDxNames.push(name);
        });

        if (orderedDxNames.length > 0) {
            critEl.classList.remove('d-none');
            const groupsHtml = orderedDxNames.map(name => {
                const listItems = Array.from(reasonsByDx[name]).map(r => `<li>${r}</li>`).join('');
                return `<div class="mb-1"><span class="fw-semibold">${name}:</span><ul class="mb-0 ps-3">${listItems}</ul></div>`;
            }).join('');
            critEl.innerHTML = `<div class="fw-semibold mb-1">Criterios detectados:</div>${groupsHtml}`;
        } else {
            critEl.classList.add('d-none');
            critEl.innerHTML = '';
        }
    }
}

// Limpiar formulario y resultados en Lectura Guiada
function limpiarFormularioLG() {
    const form = document.getElementById('ecgForm');
    if (form) {
        // Reset de inputs y selects
        Array.from(form.querySelectorAll('input, select')).forEach(el => {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = false;
            } else {
                el.value = '';
            }
        });
    }
    // Limpiar resultados y ocultar contenedores
    const informeEl = document.getElementById('informeECG');
    if (informeEl) {
        informeEl.textContent = 'Complete el formulario y haga clic en "Generar informe" para ver el resultado.';
    }
    const sospechaEl = document.getElementById('resultadoSospecha');
    if (sospechaEl) {
        sospechaEl.classList.add('d-none');
        sospechaEl.textContent = '';
        sospechaEl.innerHTML = '';
    }
    const imgCont = document.getElementById('sospechaImagen');
    if (imgCont) {
        imgCont.innerHTML = '';
    }
    const critEl = document.getElementById('criteriosDetectados');
    if (critEl) {
        critEl.classList.add('d-none');
        critEl.textContent = '';
        critEl.innerHTML = '';
    }
}

function copiarSospecha() {
    const el = document.getElementById('resultadoSospecha');
    const text = el ? el.textContent : '';
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => alert('Sospecha copiada al portapapeles'))
        .catch(() => alert('No se pudo copiar la sospecha'));
}

// Función para activar la cámara
function activarCamara() {
    // Verificar si el navegador soporta la API de MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta la captura de imágenes. Por favor, sube una imagen manualmente.');
        return;
    }

    // Crear elementos para la cámara si no existen
    let videoElement = document.getElementById('camaraVideo');
    if (!videoElement) {
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.classList.remove('d-none');
        
        // Crear elemento de video
        videoElement = document.createElement('video');
        videoElement.id = 'camaraVideo';
        videoElement.autoplay = true;
        videoElement.classList.add('img-fluid', 'mb-2');
        
        // Crear botón para capturar
        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Capturar';
        captureBtn.classList.add('btn', 'btn-success', 'mb-3');
        captureBtn.id = 'captureBtn';
        
        // Agregar elementos al contenedor
        previewContainer.innerHTML = '';
        previewContainer.appendChild(videoElement);
        previewContainer.appendChild(captureBtn);
        
        // Agregar evento al botón de captura
        captureBtn.addEventListener('click', capturarImagen);
    }

    // Solicitar acceso a la cámara
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
        })
        .catch(error => {
            console.error('Error al acceder a la cámara: ', error);
            alert('No se pudo acceder a la cámara. Por favor, sube una imagen manualmente.');
        });
}

// Función para capturar imagen de la cámara
function capturarImagen() {
    const videoElement = document.getElementById('camaraVideo');
    const previewContainer = document.getElementById('previewContainer');
    
    // Crear un canvas para capturar la imagen
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convertir a imagen
    const imageDataURL = canvas.toDataURL('image/png');
    
    // Detener la transmisión de video
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    
    // Mostrar la imagen capturada
    previewContainer.innerHTML = '';
    const imgElement = document.createElement('img');
    imgElement.id = 'ecgPreview';
    imgElement.src = imageDataURL;
    imgElement.classList.add('img-fluid', 'border');
    imgElement.alt = 'ECG capturado';
    previewContainer.appendChild(imgElement);
    
    // Habilitar todos los botones de análisis
    document.getElementById('analizarECG').disabled = false;
    document.getElementById('enviarChatGPT').disabled = false;
    document.getElementById('buscarImagenesSimilares').disabled = false;
}

// Función para mostrar vista previa de imagen subida
function mostrarVistaPrevia(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('previewContainer');
            previewContainer.classList.remove('d-none');
            previewContainer.innerHTML = '';
            
            const imgElement = document.createElement('img');
            imgElement.id = 'ecgPreview';
            imgElement.src = e.target.result;
            imgElement.classList.add('img-fluid', 'border');
            imgElement.alt = 'ECG subido';
            previewContainer.appendChild(imgElement);
            
            // Habilitar todos los botones de análisis
            document.getElementById('analizarECG').disabled = false;
            document.getElementById('enviarChatGPT').disabled = false;
            document.getElementById('buscarImagenesSimilares').disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

// Función para analizar el ECG
function analizarECG() {
    // En una aplicación real, aquí se enviaría la imagen a un servidor para análisis
    // Para esta demo, mostraremos resultados simulados
    
    document.getElementById('resultadoAnalisis').classList.remove('d-none');
    document.getElementById('chatGPTAnalisis').classList.add('d-none');
    document.getElementById('imagenesEncontradas').classList.add('d-none');
    
    // Simular carga
    const listaPatrones = document.getElementById('listaPatrones');
    listaPatrones.innerHTML = '<li>Analizando imagen...</li>';
    
    // Después de 2 segundos, mostrar resultados simulados
    setTimeout(() => {
        listaPatrones.innerHTML = `
            <li><strong>Alta probabilidad (85%):</strong> Ritmo sinusal normal</li>
            <li><strong>Probabilidad media (45%):</strong> Posible hipertrofia ventricular izquierda</li>
            <li><strong>Baja probabilidad (25%):</strong> Alteraciones inespecíficas de la repolarización</li>
        `;
    }, 2000);
}

// Función para enviar la imagen a ChatGPT para análisis
function enviarAChatGPT() {
    // Mostrar el contenedor de análisis de ChatGPT
    document.getElementById('chatGPTAnalisis').classList.remove('d-none');
    document.getElementById('resultadoAnalisis').classList.add('d-none');
    document.getElementById('imagenesEncontradas').classList.add('d-none');
    
    // En una aplicación real, aquí se enviaría la imagen a la API de ChatGPT
    // Para esta demo, mostraremos resultados simulados
    
    // Simular carga
    const chatGPTRespuesta = document.getElementById('chatGPTRespuesta');
    chatGPTRespuesta.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
        </div>
        <p>Consultando a ChatGPT...</p>
    `;
    
    // Después de 3 segundos, mostrar resultados simulados
    setTimeout(() => {
        const respuestaSimulada = `
            <h5>Análisis del ECG:</h5>
            <p>Basado en la imagen proporcionada, este ECG muestra un <strong>ritmo sinusal normal</strong> con una frecuencia cardíaca de aproximadamente 75 latidos por minuto.</p>
            
            <h5>Características observadas:</h5>
            <ul>
                <li>Ritmo regular con ondas P presentes antes de cada complejo QRS</li>
                <li>Intervalo PR normal (aproximadamente 160 ms)</li>
                <li>Duración del QRS normal (aproximadamente 90 ms)</li>
                <li>No hay elevación o depresión significativa del segmento ST</li>
                <li>Ondas T de morfología normal</li>
                <li>No hay signos de hipertrofia ventricular</li>
            </ul>
            
            <h5>Interpretación:</h5>
            <p>Este ECG se considera dentro de los límites normales sin evidencia de patología cardíaca significativa. Recomendaría correlacionar estos hallazgos con la historia clínica y el examen físico del paciente.</p>
            
            <button type="button" class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#chatGPTModal">
                Ver análisis completo
            </button>
        `;
        
        chatGPTRespuesta.innerHTML = respuestaSimulada;
        
        // También actualizar el contenido del modal
        document.getElementById('chatGPTModalContent').innerHTML = respuestaSimulada + `
            <h5 class="mt-4">Diagnóstico diferencial:</h5>
            <ul>
                <li>ECG normal</li>
                <li>Variante normal</li>
                <li>Posibles cambios no específicos que requieren correlación clínica</li>
            </ul>
            
            <h5>Recomendaciones:</h5>
            <ul>
                <li>Si el paciente está asintomático y este es un ECG de rutina, no se requieren más estudios.</li>
                <li>Si el paciente presenta síntomas cardíacos, considerar evaluación adicional según la presentación clínica.</li>
                <li>Seguimiento regular según factores de riesgo cardiovascular del paciente.</li>
            </ul>
            
            <div class="alert alert-info mt-3">
                <strong>Nota:</strong> Este análisis es generado por IA y no sustituye la interpretación de un profesional médico calificado. Siempre consulte con un cardiólogo para la interpretación definitiva de un ECG.
            </div>
        `;
    }, 3000);
}

// Función para buscar imágenes similares
function buscarImagenesSimilares() {
    // Mostrar el contenedor de imágenes encontradas
    document.getElementById('imagenesEncontradas').classList.remove('d-none');
    document.getElementById('resultadoAnalisis').classList.add('d-none');
    document.getElementById('chatGPTAnalisis').classList.add('d-none');
    
    // En una aplicación real, aquí se enviaría la imagen a un servicio de búsqueda de imágenes
    // Para esta demo, mostraremos resultados simulados
    
    const galeriaImagenes = document.getElementById('galeriaImagenes');
    galeriaImagenes.innerHTML = `
        <div class="col-12 text-center mb-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Buscando imágenes similares...</span>
            </div>
            <p>Buscando imágenes similares en la web...</p>
        </div>
    `;
    
    // Después de 3 segundos, mostrar resultados simulados
    setTimeout(() => {
        galeriaImagenes.innerHTML = `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://litfl.com/wp-content/uploads/2018/08/normal-sinus-rhythm-ecg.jpg" class="card-img-top" alt="ECG similar 1">
                    <div class="card-body">
                        <h5 class="card-title">Ritmo sinusal normal</h5>
                        <p class="card-text">Coincidencia: 92%</p>
                        <a href="https://litfl.com/normal-sinus-rhythm-ecg-library/" class="btn btn-primary btn-sm" target="_blank">Ver fuente</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://litfl.com/wp-content/uploads/2018/08/ECG-Sinus-bradycardia.jpg" class="card-img-top" alt="ECG similar 2">
                    <div class="card-body">
                        <h5 class="card-title">Bradicardia sinusal</h5>
                        <p class="card-text">Coincidencia: 78%</p>
                        <a href="https://litfl.com/sinus-bradycardia-ecg-library/" class="btn btn-primary btn-sm" target="_blank">Ver fuente</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://litfl.com/wp-content/uploads/2018/08/ECG-Left-bundle-branch-block-LBBB.jpg" class="card-img-top" alt="ECG similar 3">
                    <div class="card-body">
                        <h5 class="card-title">Bloqueo de rama izquierda</h5>
                        <p class="card-text">Coincidencia: 65%</p>
                        <a href="https://litfl.com/left-bundle-branch-block-lbbb-ecg-library/" class="btn btn-primary btn-sm" target="_blank">Ver fuente</a>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="alert alert-warning">
                    <strong>Nota:</strong> Las imágenes mostradas son solo ejemplos y no representan un diagnóstico médico. Consulte siempre con un profesional de la salud para la interpretación correcta de un ECG.
                </div>
            </div>
        `;
    }, 3000);
}

// Función para guardar el análisis como PDF
function guardarAnalisisPDF() {
    // En una aplicación real, aquí se generaría un PDF con el análisis
    // Para esta demo, mostraremos un mensaje de simulación
    alert('Funcionalidad de guardar como PDF simulada. En una aplicación real, se generaría un PDF con el análisis completo.');
}

// Funciones V2 para la nueva versión de "Comparación de Patrones"
function capturarDesdeArchivoV2() {
    const fileInput = document.getElementById('ecgFileInput');
    const file = fileInput && fileInput.files[0];
    if (!file) {
        alert('Selecciona una imagen de ECG desde el selector.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewContainer = document.getElementById('vistaPrevia');
        if (!previewContainer) return;
        previewContainer.classList.remove('d-none');
        previewContainer.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.id = 'ecgPreview';
        imgElement.src = e.target.result;
        imgElement.classList.add('img-fluid', 'border');
        imgElement.alt = 'ECG subido';
        previewContainer.appendChild(imgElement);
        ['btnAnalisisLocal', 'btnAnalisisChatGPT', 'btnAnalisisSimilares'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    };
    reader.readAsDataURL(file);
}

function limpiarCapturaV2() {
    const previewContainer = document.getElementById('vistaPrevia');
    if (previewContainer) {
        previewContainer.classList.add('d-none');
        previewContainer.innerHTML = '';
    }
    ['btnAnalisisLocal', 'btnAnalisisChatGPT', 'btnAnalisisSimilares'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
    ['resultadoLocal', 'resultadoChatGPT', 'resultadoSimilares'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('d-none');
    });
}

function analizarECG_V2() {
    const resultadoLocal = document.getElementById('resultadoLocal');
    const resultadoChatGPT = document.getElementById('resultadoChatGPT');
    const resultadoSimilares = document.getElementById('resultadoSimilares');
    if (resultadoLocal) {
        resultadoLocal.classList.remove('d-none');
        resultadoLocal.innerHTML = '<div class="alert alert-secondary">Analizando imagen...</div>';
    }
    if (resultadoChatGPT) resultadoChatGPT.classList.add('d-none');
    if (resultadoSimilares) resultadoSimilares.classList.add('d-none');
    setTimeout(() => {
        if (resultadoLocal) {
            resultadoLocal.innerHTML = `
                <ul class="mb-0">
                    <li><strong>Alta probabilidad (85%):</strong> Ritmo sinusal normal</li>
                    <li><strong>Probabilidad media (45%):</strong> Posible hipertrofia ventricular izquierda</li>
                    <li><strong>Baja probabilidad (25%):</strong> Alteraciones inespecíficas de la repolarización</li>
                </ul>
            `;
        }
    }, 2000);
}

function enviarAChatGPT_V2() {
    const resultadoLocal = document.getElementById('resultadoLocal');
    const resultadoChatGPT = document.getElementById('resultadoChatGPT');
    const resultadoSimilares = document.getElementById('resultadoSimilares');
    if (resultadoChatGPT) {
        resultadoChatGPT.classList.remove('d-none');
        resultadoChatGPT.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Consultando a ChatGPT...</p>
            </div>
        `;
    }
    if (resultadoLocal) resultadoLocal.classList.add('d-none');
    if (resultadoSimilares) resultadoSimilares.classList.add('d-none');

    setTimeout(() => {
        const resumen = `
            <h5>Análisis del ECG:</h5>
            <p>Basado en la imagen proporcionada, este ECG muestra un <strong>ritmo sinusal normal</strong> con una frecuencia cardíaca de aproximadamente 75 latidos por minuto.</p>
            <h5>Características observadas:</h5>
            <ul>
                <li>Ondas P antes de cada QRS</li>
                <li>Intervalo PR normal (~160 ms)</li>
                <li>Duración del QRS normal (~90 ms)</li>
                <li>Sin cambios significativos del ST</li>
                <li>Ondas T de morfología normal</li>
            </ul>
            <h5>Interpretación:</h5>
            <p>ECG dentro de límites normales. Correlacionar con clínica.</p>
            <button type="button" class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#chatGPTModal">Ver análisis completo</button>
        `;
        if (resultadoChatGPT) resultadoChatGPT.innerHTML = resumen;
        const modalBody = document.getElementById('chatGPTModalBody');
        if (modalBody) {
            modalBody.innerHTML = resumen + `
                <h5 class="mt-4">Diagnóstico diferencial:</h5>
                <ul>
                    <li>ECG normal</li>
                    <li>Variante normal</li>
                    <li>Cambios inespecíficos</li>
                </ul>
                <h5>Recomendaciones:</h5>
                <ul>
                    <li>Si es de rutina y asintomático, sin estudios adicionales.</li>
                    <li>Si hay síntomas, evaluar según presentación clínica.</li>
                    <li>Seguimiento según riesgos cardiovasculares.</li>
                </ul>
                <div class="alert alert-info mt-3">
                    <strong>Nota:</strong> Análisis generado por IA. No sustituye evaluación médica.
                </div>
            `;
        }
    }, 3000);
}

function buscarImagenesSimilares_V2() {
    const resultadoLocal = document.getElementById('resultadoLocal');
    const resultadoChatGPT = document.getElementById('resultadoChatGPT');
    const resultadoSimilares = document.getElementById('resultadoSimilares');
    if (resultadoSimilares) {
        resultadoSimilares.classList.remove('d-none');
        resultadoSimilares.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Buscando imágenes similares...</span>
                </div>
                <p class="mt-2">Buscando patrones similares...</p>
            </div>
        `;
    }
    if (resultadoLocal) resultadoLocal.classList.add('d-none');
    if (resultadoChatGPT) resultadoChatGPT.classList.add('d-none');

    setTimeout(() => {
        if (resultadoSimilares) {
            resultadoSimilares.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Resultados simulados:</strong>
                    <ul class="mb-0">
                        <li>Ritmo sinusal normal — coincidencia 92%</li>
                        <li>Bradicardia sinusal — coincidencia 78%</li>
                        <li>Bloqueo de rama izquierda — coincidencia 65%</li>
                    </ul>
                </div>
            `;
        }
    }, 3000);
}
// (bloque previo de territorios trasladado dentro de generarSospechaECG)

// --- Módulo de Búsqueda de Patrones y Ventana Emergente ---

const patronesDatabase = [
    {
        nombre: "Síndrome de Brugada (Tipo 1 y 2)",
        keywords: ["brugada", "aleta de tiburon", "silla de montar", "muerte súbita", "V1", "V2", "st elevado"],
        criterios: [
            "Tipo 1 (Coved): Elevación del ST ≥2 mm con morfología convexa (aleta de tiburón) en V1-V2, seguida de onda T negativa.",
            "Tipo 2 (Saddleback): Elevación del ST ≥2 mm con morfología en silla de montar en V1-V2.",
            "Posible bloqueo incompleto de rama derecha asociado."
        ],
        clinica: "Síncope de repetición, antecedentes familiares de muerte súbita en menores de 45 años, respiración agonal nocturna. A menudo el ECG es normal y se desenmascara con fiebre o fármacos.",
        manejo: "Evitar fármacos desencadenantes (antiarrítmicos clase I, algunos antidepresivos). Tratar la fiebre de forma agresiva. Evaluación por electrofisiología para considerar Desfibrilador Automático Implantable (DAI)."
    },
    {
        nombre: "Patrón de Wellens (Tipo A y B)",
        keywords: ["wellens", "T bifasica", "T invertida", "descendente anterior", "DA", "isquemia"],
        criterios: [
            "Tipo A: Ondas T bifásicas en V2-V3 (inicial positiva, terminal negativa).",
            "Tipo B: Ondas T profundamente invertidas y simétricas en V2-V3 (a veces V1-V6).",
            "Ausencia de ondas Q patológicas y progresión normal de la onda R."
        ],
        clinica: "Angina reciente que ha cedido (el paciente suele estar sin dolor al tomar el ECG). Indica estenosis crítica de la arteria descendente anterior (DA) proximal.",
        manejo: "Emergencia médica. NO realizar prueba de esfuerzo (alto riesgo de oclusión total e infarto extenso). Ingreso para coronariografía urgente y revascularización."
    },
    {
        nombre: "Patrón de De Winter",
        keywords: ["de winter", "st descendido", "T alta", "equivalente stemi", "DA"],
        criterios: [
            "Descenso del segmento ST en el punto J (1-3 mm) con pendiente ascendente en derivaciones precordiales (V1-V6).",
            "Ondas T altas, picudas y simétricas tras el descenso del ST.",
            "Elevación del ST en aVR (0.5-2 mm)."
        ],
        clinica: "Equivalente de IAMCEST (STEMI). Indica oclusión aguda de la arteria descendente anterior proximal en el 2% de los infartos anteriores.",
        manejo: "Activación de código infarto. Reperfusión inmediata mediante Intervención Coronaria Percutánea (ICP) primaria."
    },
    {
        nombre: "Síndrome de Wolff-Parkinson-White (WPW)",
        keywords: ["wpw", "wolff", "pr corto", "onda delta", "preexcitacion"],
        criterios: [
            "Tríada clásica: Intervalo PR corto (<120 ms), presencia de Onda Delta (empastamiento inicial del QRS) y QRS ancho (>120 ms).",
            "Cambios secundarios en la repolarización (ST-T opuestos a la onda delta)."
        ],
        clinica: "Palpitaciones súbitas, síncope o presíncope. Riesgo de taquicardia por reentrada auriculoventricular y, en casos graves, muerte súbita por fibrilación auricular preexcitada.",
        manejo: "Maniobras vagales y adenosina si la taquicardia es regular y estrecha. En FA preexcitada: Procainamida o amiodarona (EVITAR bloqueadores del nodo AV como verapamilo o digoxina). Ablación por radiofrecuencia de la vía accesoria."
    },
    {
        nombre: "Signo de S1Q3T3 (McGinn-White)",
        keywords: ["s1q3t3", "tep", "tromboembolismo", "cor pulmonale", "mcginn"],
        criterios: [
            "Onda S profunda en derivación I.",
            "Onda Q prominente en derivación III.",
            "Onda T negativa (invertida) en derivación III."
        ],
        clinica: "Sugestivo de sobrecarga aguda del ventrículo derecho, clásicamente asociado a Tromboembolismo Pulmonar (TEP). El síntoma principal es disnea súbita y taquicardia.",
        manejo: "Valoración de probabilidad clínica (Escala de Wells/Geneva). Dímero D, Angio-TC pulmonar o Gammagrafía V/Q. Anticoagulación inmediata si se confirma TEP."
    },
    {
        nombre: "Onda Épsilon (Displasia del VD)",
        keywords: ["epsilon", "displasia", "arritmogenica", "ventriculo derecho", "muerte subita"],
        criterios: [
            "Pequeña muesca o delación positiva al final del complejo QRS y comienzo del segmento ST en derivaciones V1-V3.",
            "Acompañado a menudo de ondas T invertidas en V1-V3."
        ],
        clinica: "Displasia Arritmogénica del Ventrículo Derecho (DAVD). Puede causar arritmias ventriculares graves inducidas por el ejercicio y muerte súbita en atletas jóvenes.",
        manejo: "Restricción de ejercicio físico intenso. Beta-bloqueadores. Valoración de DAI según riesgo de arritmias."
    },
    {
        nombre: "Síndrome de QT Largo",
        keywords: ["qt largo", "qtc", "torsades", "sincope", "electrolitos"],
        criterios: [
            "Intervalo QT corregido (QTc) >440 ms en hombres o >460 ms en mujeres.",
            "Fórmula de Bazett: QTc = QT / √RR."
        ],
        clinica: "Síncope, convulsiones o muerte súbita debido a Torsión de Puntas. Puede ser congénito o adquirido (fármacos, hipokalemia, hipomagnesemia).",
        manejo: "Beta-bloqueadores (especialmente Nadolol). Evitar fármacos que prolonguen el QT (ver CredibleMeds). Corregir alteraciones electrolíticas (K+ y Mg2+)."
    },
    {
        nombre: "Torsión de Puntas (Torsades de Pointes)",
        keywords: ["torsades", "torsion de puntas", "tv polimorfica", "magnesio", "qt largo"],
        criterios: [
            "Taquicardia ventricular polimórfica caracterizada por una rotación cíclica del eje del QRS sobre la línea isoeléctrica.",
            "Típicamente precedida por un intervalo QT largo."
        ],
        clinica: "Síncope, mareo extremo, palpitaciones rápidas. Puede autolimitarse o degenerar en fibrilación ventricular.",
        manejo: "Sulfato de Magnesio (2g IV en bolo). Desfibrilación si hay inestabilidad. Retirar fármacos causantes y corregir hipopotasemia."
    },
    {
        nombre: "Pericarditis Aguda (Estadio 1)",
        keywords: ["pericarditis", "st difuso", "pr deprimido", "dolor pleuritico"],
        criterios: [
            "Elevación difusa del segmento ST con morfología cóncava (en todas las derivaciones excepto aVR y V1).",
            "Depresión del segmento PR (signo muy específico).",
            "Elevación del PR en aVR."
        ],
        clinica: "Dolor torácico de tipo pleurítico que empeora al acostarse y mejora al inclinarse hacia adelante. A menudo precedido por cuadro viral.",
        manejo: "AINEs a dosis altas (Aspirina o Ibuprofeno) asociados a Colchicina para reducir recurrencias. Reposo físico."
    },
    {
        nombre: "Efecto de la Digital (Cubeta Digitálica)",
        keywords: ["digital", "digoxina", "cubeta", "st descendido", "intoxicacion"],
        criterios: [
            "Descenso del segmento ST de forma cóncava (como una cuchara o cubeta).",
            "Acortamiento del intervalo QT.",
            "Ondas T aplanadas o invertidas."
        ],
        clinica: "Hallazgo frecuente en pacientes que toman digoxina. Indica efecto farmacológico (impregnación), no necesariamente toxicidad.",
        manejo: "Monitorizar niveles de digoxina y potasio. No requiere tratamiento si el paciente está asintomático y los niveles son terapéuticos."
    },
    {
        nombre: "Patrón de Strain (Sobrecarga Ventricular)",
        keywords: ["strain", "sobrecarga", "hvi", "hvd", "hipertrofia"],
        criterios: [
            "Descenso del segmento ST y onda T invertida asimétrica.",
            "V5-V6: Sugiere sobrecarga del Ventrículo Izquierdo (HVI).",
            "V1-V2: Sugiere sobrecarga del Ventrículo Derecho (HVD)."
        ],
        clinica: "Asociado a hipertrofia ventricular por hipertensión arterial, estenosis aórtica o hipertensión pulmonar.",
        manejo: "Tratamiento de la causa subyacente (control de la presión arterial, valoración valvular)."
    },
    {
        nombre: "Bloqueo Fascicular Anterior Izquierdo (BFAI)",
        keywords: ["bfai", "eje izquierdo", "bloqueo fascicular"],
        criterios: [
            "Desviación marcada del eje a la izquierda (entre -45° y -90°).",
            "Morfología qR en I y aVL.",
            "Morfología rS en II, III y aVF."
        ],
        clinica: "Frecuente en adultos mayores. Puede ser idiopático o asociado a cardiopatía isquémica o hipertensiva.",
        manejo: "Generalmente no requiere tratamiento específico por sí solo. Control de factores de riesgo cardiovascular."
    },
    {
        nombre: "Ondas J de Osborn (Hipotermia)",
        keywords: ["osborn", "onda j", "hipotermia", "frio"],
        criterios: [
            "Deflexión positiva prominente en la unión del complejo QRS con el segmento ST (punto J).",
            "Su amplitud suele ser proporcional al grado de hipotermia."
        ],
        clinica: "Hipotermia sistémica (habitualmente <32°C). También puede verse en hipercalcemia grave o lesiones cerebrales.",
        manejo: "Recalentamiento gradual del paciente y soporte vital. Manejo de la causa base."
    },
    {
        nombre: "Ritmo Idioventricular Acelerado (RIVA)",
        keywords: ["riva", "reperfusion", "ritmo ventricular", "post-angioplastia"],
        criterios: [
            "Ritmo ventricular regular con QRS ancho (>120 ms).",
            "Frecuencia cardíaca entre 60 y 110 lpm.",
            "A menudo se observan latidos de fusión o captura al inicio/final."
        ],
        clinica: "Clásico 'ritmo de reperfusión' tras abrir una arteria coronaria ocluida. Generalmente benigno y transitorio.",
        manejo: "Observación. No suele requerir tratamiento antiarrítmico a menos que cause compromiso hemodinámico."
    },
    {
        nombre: "Taquicardia Bidireccional",
        keywords: ["bidireccional", "digoxina", "toxicidad", "eje alternante"],
        criterios: [
            "Taquicardia de QRS ancho que alterna el eje eléctrico latido a latido (generalmente entre derecha e izquierda).",
            "Ritmo regular."
        ],
        clinica: "Signo clásico de intoxicación digitálica grave o de taquicardia ventricular polimórfica catecolaminérgica (TVPC).",
        manejo: "Si es por digital: Anticuerpos específicos (DigiFab), corregir potasio. Si es TVPC: Beta-bloqueadores, evitar estrés."
    },
    {
        nombre: "Fibrilación Auricular (FA)",
        keywords: ["fa", "fibrilacion", "irregular", "sin onda p"],
        criterios: [
            "Ausencia de ondas P; línea de base con oscilaciones rápidas (ondas f).",
            "Intervalos R-R 'irregularmente irregulares'.",
            "QRS generalmente estrecho."
        ],
        clinica: "Palpitaciones, disnea, fatiga. Riesgo de embolismo sistémico y falla cardíaca.",
        manejo: "Control de frecuencia (Beta-bloqueadores, Calcioantagonistas) o ritmo (Amiodarona, Cardioversión). Anticoagulación según CHADS-VASc."
    },
    {
        nombre: "Flutter Auricular",
        keywords: ["flutter", "dientes de sierra", "macroreentrada"],
        criterios: [
            "Ondas F en 'dientes de sierra' continuas, mejor vistas en II, III, aVF.",
            "Frecuencia auricular típica de 250-350 lpm.",
            "Conducción AV regular (2:1, 3:1) o variable."
        ],
        clinica: "Similar a la FA pero a menudo con frecuencia ventricular más regular.",
        manejo: "Control de frecuencia, anticoagulación. La ablación del istmo cavotricuspídeo es altamente efectiva."
    },
    {
        nombre: "Taquicardia Supraventricular (TSV)",
        keywords: ["tsv", "paroxistica", "qrs estrecho", "adenosina"],
        criterios: [
            "Ritmo regular con frecuencia cardíaca >150 lpm.",
            "QRS estrecho (<120 ms) salvo conducción aberrante previa.",
            "Ondas P a menudo ausentes o retrógradas (justo después del QRS)."
        ],
        clinica: "Inicio y fin súbitos, palpitaciones intensas, disnea, ansiedad. A menudo en pacientes jóvenes sin cardiopatía estructural.",
        manejo: "Maniobras vagales (Masaje del seno carotídeo, Valsalva). Si no cede: Adenosina 6mg bolo rápido. Cardioversión si hay inestabilidad."
    },
    {
        nombre: "Taquicardia Ventricular (TV)",
        keywords: ["tv", "qrs ancho", "disociacion av", "sostenida"],
        criterios: [
            "Sucesión de 3 o más complejos de origen ventricular a >100 lpm.",
            "QRS ancho (>120 ms).",
            "Disociación auriculoventricular (signo patognomónico).",
            "Latidos de captura o de fusión."
        ],
        clinica: "Palpitaciones, síncope, hipotensión. Puede degenerar en fibrilación ventricular.",
        manejo: "Si hay pulso e inestabilidad: Cardioversión eléctrica sincronizada. Si está estable: Amiodarona o Procainamida. Sin pulso: Desfibrilación inmediata (RCP)."
    },
    {
        nombre: "Fibrilación Ventricular (FV)",
        keywords: ["fv", "paro", "caotico", "desfibrilacion"],
        criterios: [
            "Actividad eléctrica totalmente caótica y desorganizada.",
            "Ausencia de complejos QRS, ondas P o T identificables.",
            "Amplitud variable (fina o gruesa)."
        ],
        clinica: "Paro cardiorrespiratorio inmediato. El paciente pierde el conocimiento en segundos.",
        manejo: "Desfibrilación inmediata (Carga máxima). RCP de alta calidad. Adrenalina y amiodarona según protocolo ACLS."
    },
    {
        nombre: "Bloqueo AV de 1er Grado",
        keywords: ["bav1", "pr largo"],
        criterios: [
            "Intervalo PR prolongado de forma constante (>200 ms).",
            "Cada onda P es seguida por un complejo QRS."
        ],
        clinica: "Habitualmente asintomático. Hallazgo frecuente en deportistas o por fármacos (beta-bloqueadores).",
        manejo: "Generalmente no requiere tratamiento. Observación y control de fármacos si es excesivo."
    },
    {
        nombre: "Bloqueo AV de 2do Grado - Mobitz I (Wenckebach)",
        keywords: ["mobitz 1", "wenckebach", "pr se alarga"],
        criterios: [
            "Prolongación progresiva del intervalo PR hasta que una onda P no conduce (no hay QRS).",
            "El intervalo PR tras la pausa es el más corto."
        ],
        clinica: "Suele ser asintomático y de origen nodal. Puede ocurrir durante el sueño o en atletas.",
        manejo: "Observación. Tratar solo si causa síntomas (bradicardia sintomática) con Atropina o marcapasos temporal."
    },
    {
        nombre: "Bloqueo AV de 2do Grado - Mobitz II",
        keywords: ["mobitz 2", "bloqueo av", "marcapasos"],
        criterios: [
            "Ondas P que súbitamente dejan de conducir sin prolongación previa del PR.",
            "El intervalo PR de los latidos conducidos es constante."
        ],
        clinica: "Riesgo alto de progresión a bloqueo completo y síncope (ataques de Stokes-Adams).",
        manejo: "Suele requerir implante de Marcapasos definitivo, incluso si el paciente está asintomático, debido al riesgo de progresión."
    },
    {
        nombre: "Bloqueo AV de 3er Grado (Completo)",
        keywords: ["bav3", "completo", "disociacion", "escape"],
        criterios: [
            "Disociación completa entre aurículas y ventrículos (las P y los QRS van por su cuenta).",
            "Frecuencia ventricular regular y lenta (ritmo de escape).",
            "Intervalos P-P y R-R constantes pero independientes."
        ],
        clinica: "Síncope, mareo, insuficiencia cardíaca congestiva, bradicardia extrema.",
        manejo: "Marcapasos transitorio inmediato si hay inestabilidad. Marcapasos definitivo es el tratamiento de elección."
    },
    {
        nombre: "Bloqueo de Rama Derecha (BRD)",
        keywords: ["brd", "rsr", "qrs ancho", "V1"],
        criterios: [
            "QRS ancho (≥120 ms).",
            "Morfología de rSR' en V1-V2 (orejas de conejo).",
            "Onda S ancha y profunda en I, aVL, V5 y V6."
        ],
        clinica: "Puede ser hallazgo normal o asociado a patología pulmonar, CIA o cardiopatía isquémica.",
        manejo: "Evaluación clínica general. No requiere tratamiento específico del bloqueo en sí."
    },
    {
        nombre: "Bloqueo de Rama Izquierda (BRI)",
        keywords: ["bri", "qrs ancho", "V6"],
        criterios: [
            "QRS ancho (≥120 ms).",
            "Onda R ancha, alta y muescada en I, aVL, V5 y V6 (morfología en 'M').",
            "Ausencia de ondas Q en I, V5 y V6.",
            "Ondas S profundas en V1-V2."
        ],
        clinica: "Casi siempre indica cardiopatía estructural (HTA, valvulopatía, isquemia). Un BRI nuevo con dolor torácico debe tratarse como STEMI.",
        manejo: "Estudio de función ventricular (Ecocardiograma). Evaluación isquémica."
    },
    {
        nombre: "Infarto Agudo (STEMI)",
        keywords: ["stemi", "iamcest", "st elevado", "infarto"],
        criterios: [
            "Elevación del segmento ST en ≥2 derivaciones contiguas.",
            "Hombres: ≥2mm en V2-V3 (>40a) o ≥2.5mm (<40a). ≥1mm en otras.",
            "Mujeres: ≥1.5mm en V2-V3. ≥1mm en otras."
        ],
        clinica: "Dolor torácico opresivo irradiado a mandíbula o brazo izquierdo, diaforesis, náuseas.",
        manejo: "Activación inmediata de Código Infarto. Reperfusión (ICP primaria <90 min o fibrinolisis <30 min si no hay ICP disponible). Aspirina, Clopidogrel/Ticagrelor, Heparina."
    },
    {
        nombre: "Hiperkalemia",
        keywords: ["hiperkalemia", "potasio alto", "T picuda", "qrs ancho"],
        criterios: [
            "Ondas T picudas, simétricas y de base estrecha ('en tienda de campaña').",
            "Aplanamiento de onda P y prolongación del PR.",
            "Ensanchamiento del QRS (puede llegar a ritmo sinusoidal)."
        ],
        clinica: "Debilidad muscular, arritmias. Frecuente en insuficiencia renal o por fármacos (IECA/ARAII).",
        manejo: "Gluconato de Calcio (estabiliza membrana), Insulina + Glucosa, Salbutamol, Diuréticos o Diálisis según gravedad."
    },
    {
        nombre: "Hipokalemia",
        keywords: ["hipokalemia", "potasio bajo", "onda u", "st descendido"],
        criterios: [
            "Presencia de onda U prominente (tras la onda T).",
            "Aplanamiento o inversión de la onda T.",
            "Descenso leve del segmento ST."
        ],
        clinica: "Debilidad, calambres, arritmias (riesgo de Torsades si QT se prolonga).",
        manejo: "Reposición de Potasio (oral o IV según gravedad). Corregir Magnesio asociado."
    },
    {
        nombre: "Isquemia Subendocárdica / NSTEMI",
        keywords: ["nstemi", "isquemia", "subendocardica", "st descendido", "T invertida"],
        criterios: [
            "Depresión del segmento ST (descenso) ≥0.5 mm en dos derivaciones contiguas.",
            "Inversión de la onda T (>1 mm) en derivaciones con R prominente.",
            "Cambios dinámicos en el ST o la onda T en ECG seriados."
        ],
        clinica: "Dolor torácico opresivo de características anginosas. A diferencia del STEMI, no hay elevación persistente del ST ni ondas Q inmediatas. Elevación de biomarcadores (Troponinas) confirma el infarto.",
        manejo: "Antiagregación (Aspirina + Clopidogrel/Ticagrelor), anticoagulación (Heparina), Beta-bloqueadores, Nitratos. Estratificación de riesgo para coronariografía (urgente o diferida)."
    },
    {
        nombre: "Hipertrofia Ventricular Izquierda (HVI)",
        keywords: ["hvi", "sokolow", "cornell", "voltaje", "hipertension"],
        criterios: [
            "Índice de Sokolow-Lyon: S en V1 + R en V5 o V6 > 35 mm.",
            "Índice de Cornell: R en aVL + S en V3 > 28 mm (hombres) o > 20 mm (mujeres).",
            "Desviación del eje a la izquierda y patrón de 'Strain' (ST descendido y T invertida) en derivaciones laterales (V5, V6, I, aVL)."
        ],
        clinica: "Hallazgo común en hipertensión arterial crónica, estenosis aórtica o miocardiopatía hipertrófica. Aumenta el riesgo de falla cardíaca y arritmias.",
        manejo: "Control estricto de la presión arterial (IECA, ARA-II). Evaluación de valvulopatías mediante ecocardiograma."
    }
];

// Mapeo de imágenes para diagnósticos y buscador
const ecgImagesMap = [
    // Arritmias
    { match: /^Flutter auricular$/i, src: 'img/flutter-12-lead.jpg', alt: 'Flutter auricular (12 derivaciones)' },
    { match: /^Fibrilación auricular \(FA\)$/i, src: 'img/fa-12-lead.jpg', alt: 'Fibrilación auricular (12 derivaciones)' },
    { match: /^Taquicardia supraventricular \(TSV\)$/i, src: 'img/tsv-12-lead.jpg', alt: 'Taquicardia supraventricular (12 derivaciones)' },
    { match: /^Taquicardia ventricular \(TV\)$/i, src: 'img/tv-12-lead.jpg', alt: 'Taquicardia ventricular (12 derivaciones)' },
    { match: /^Fibrilación ventricular \(FV\)$/i, src: 'img/fv-12-lead.jpg', alt: 'Fibrilación ventricular (12 derivaciones)' },
    { match: /Torsión de Puntas/i, src: 'img/torsades-de-pointes.jpg', alt: 'Torsión de Puntas (Torsades de Pointes)' },
    { match: /Bidireccional/i, src: 'img/bidirectional-tv.jpg', alt: 'Taquicardia Bidireccional' },
    { match: /RIVA|Idioventricular/i, src: 'img/riva.jpg', alt: 'Ritmo Idioventricular Acelerado (RIVA)' },
    
    // Bloqueos y Conducción
    { match: /^Bloqueo AV de 1er Grado$/i, src: 'img/bav1-12-lead.jpg', alt: 'Bloqueo AV de primer grado (12 derivaciones)' },
    { match: /Mobitz II/i, src: 'img/mobitz2-12-lead.jpg', alt: 'Bloqueo AV de segundo grado — Mobitz II (12 derivaciones)' },
    { match: /Mobitz I/i, src: 'img/mobitz1-12-lead.PNG', alt: 'Bloqueo AV de segundo grado — Mobitz I (12 derivaciones)' },
    { match: /Bloqueo AV de 3er Grado|Bloqueo AV Completo/i, src: 'img/bav3-12-lead.jpg', alt: 'Bloqueo AV completo (12 derivaciones)' },
    { match: /^Bloqueo de Rama Derecha \(BRD\)$/i, src: 'img/brd-12-lead.jpg', alt: 'Bloqueo de rama derecha (12 derivaciones)' },
    { match: /^Bloqueo de Rama Izquierda \(BRI\)$/i, src: 'img/bri-12-lead.jpg', alt: 'Bloqueo de rama izquierda (12 derivaciones)' },
    { match: /BFAI|Bloqueo Fascicular Anterior/i, src: 'img/bfai.jpg', alt: 'Bloqueo Fascicular Anterior Izquierdo (BFAI)' },
    { match: /WPW|Wolff-Parkinson-White/i, src: 'img/wpw-delta.jpg', alt: 'Síndrome de Wolff-Parkinson-White (WPW)' },
    
    // Isquemia e Infarto
    { match: /^Isquemia Subendocárdica \/ NSTEMI$/i, src: 'img/nstemi-12-lead.jpg', alt: 'NSTEMI / isquemia subendocárdica (12 derivaciones)' },
    { match: /^Infarto Agudo \(STEMI\)$/i, src: 'img/stemi-12-lead.jpg', alt: 'STEMI (12 derivaciones)' },
    { match: /Wellens/i, src: 'img/wellens-v2-v3.jpg', alt: 'Patrón de Wellens (V2-V3)' },
    { match: /De Winter/i, src: 'img/de-winter.jpg', alt: 'Patrón de De Winter' },
    
    // Otros Patrones Específicos
    { match: /Brugada/i, src: 'img/brugada-12-lead.jpg', alt: 'Síndrome de Brugada' },
    { match: /QT Largo/i, src: 'img/qt-largo-medicion.jpg', alt: 'Síndrome de QT Largo (Medición)' },
    { match: /S1Q3T3|McGinn/i, src: 'img/s1q3t3.jpg', alt: 'Signo de S1Q3T3 (McGinn-White)' },
    { match: /Épsilon/i, src: 'img/epsilon-wave.jpg', alt: 'Onda Épsilon' },
    { match: /Osborn|Hipotermia/i, src: 'img/osborn-wave.jpg', alt: 'Ondas J de Osborn' },
    { match: /Pericarditis/i, src: 'img/pericarditis-st-difuso.jpg', alt: 'Pericarditis Aguda (ST difuso)' },
    { match: /Digital|Cubeta/i, src: 'img/cubeta-digitalica.jpg.png', alt: 'Efecto de la Digital (Cubeta Digitálica)' },
    { match: /Strain|Sobrecarga/i, src: 'img/hvi-12-lead.jpg', alt: 'Patrón de Strain / Sobrecarga Ventricular' },
    
    // Hipertrofia y Electrolitos
    { match: /^Hipertrofia Ventricular Izquierda \(HVI\)$/i, src: 'img/hvi-12-lead.jpg', alt: 'Hipertrofia ventricular izquierda (12 derivaciones)' },
    { match: /^Hiperkalemia$/i, src: 'img/hiperkalemia.jpg', alt: 'Hiperkalemia' },
    { match: /^Hipokalemia$/i, src: 'img/hipokalemia.jpg', alt: 'Hipokalemia' }
];

// Inicializar búsqueda
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('patronSearch');
    const suggestionsList = document.getElementById('searchSuggestions');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            suggestionsList.classList.add('d-none');
            return;
        }

        const filtered = patronesDatabase.filter(p => 
            p.nombre.toLowerCase().includes(query) || 
            p.keywords.some(k => k.toLowerCase().includes(query))
        );

        if (filtered.length > 0) {
            suggestionsList.innerHTML = filtered.map(p => `
                <div class="search-suggestion-item" onclick="openPatronDetail('${p.nombre}')">
                    <span class="item-title">${p.nombre}</span>
                    <span class="item-desc">${p.criterios[0].substring(0, 60)}...</span>
                </div>
            `).join('');
            suggestionsList.classList.remove('d-none');
        } else {
            // Opción para preguntar a la IA si no hay resultados parametrizados
            suggestionsList.innerHTML = `
                <div class="search-suggestion-item ai-suggestion" onclick="askAIAbout('${query}')">
                    <span class="item-title text-primary"><i class="bi bi-robot me-2"></i>Preguntar a la IA sobre "${query}"</span>
                    <span class="item-desc">No encontramos este patrón, pero la IA de EKG-LA puede ayudarte.</span>
                </div>
            `;
            suggestionsList.classList.remove('d-none');
        }
    });

    // Manejar tecla Enter en el buscador
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                const exactMatch = patronesDatabase.find(p => p.nombre.toLowerCase() === query.toLowerCase());
                if (exactMatch) {
                    openPatronDetail(exactMatch.nombre);
                } else {
                    askAIAbout(query);
                }
            }
        }
    });

    // Cerrar sugerencias al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add('d-none');
        }
    });
});

// Función global para abrir el detalle del patrón
window.openPatronDetail = function(nombre) {
    const patron = patronesDatabase.find(p => p.nombre === nombre);
    if (!patron) return;

    const modalTitle = document.getElementById('patronModalLabel');
    const modalBody = document.getElementById('patronModalBody');
    const suggestionsList = document.getElementById('searchSuggestions');

    if (modalTitle) modalTitle.innerText = patron.nombre;
    
    // Buscar imagen para el patrón
    const imgEntry = ecgImagesMap.find(e => e.match.test(patron.nombre));
    let imgHtml = '';
    if (imgEntry) {
        imgHtml = `
            <div class="mt-2 mb-4 text-center">
                <img src="${imgEntry.src}" alt="${imgEntry.alt}" class="img-fluid rounded shadow-sm border" style="max-height: 280px; width: auto;">
                <p class="small text-muted mt-2"><i class="bi bi-image me-1"></i> Ejemplo: ${imgEntry.alt}</p>
            </div>
        `;
    }

    if (modalBody) {
        modalBody.innerHTML = `
            <div class="patron-detail-content">
                ${imgHtml}
                <h6>Criterios Electrocardiográficos</h6>
                <ul>
                    ${patron.criterios.map(c => `<li>${c}</li>`).join('')}
                </ul>
                
                <h6>Cuadro Clínico</h6>
                <p>${patron.clinica}</p>
                
                <h6>Manejo Médico Inicial y Conducta</h6>
                <p>${patron.manejo}</p>
                
                <div class="mt-4 pt-3 border-top">
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Información basada en guías de práctica clínica y literatura médica (2021-2026).
                    </small>
                </div>
            </div>
        `;
    }

    // Cerrar sugerencias si están abiertas
    if (suggestionsList) suggestionsList.classList.add('d-none');

    // Mostrar modal (usando Bootstrap)
    const modalEl = document.getElementById('patronModal');
    if (modalEl) {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
};

// Función para consultar a la IA desde el buscador
window.askAIAbout = function(query) {
    const modalTitle = document.getElementById('patronModalLabel');
    const modalBody = document.getElementById('patronModalBody');
    const suggestionsList = document.getElementById('searchSuggestions');
    const modalEl = document.getElementById('patronModal');

    if (modalTitle) modalTitle.innerHTML = `<i class="bi bi-robot me-2"></i>Asistente IA: ${query}`;
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h5 class="text-primary">Consultando a la IA de EKG-LA...</h5>
                <p class="text-muted">Estamos generando la mejor respuesta técnica para tu consulta.</p>
            </div>
        `;
    }

    if (suggestionsList) suggestionsList.classList.add('d-none');
    
    // Mostrar el modal
    let modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
    }
    modalInstance.show();

    // Llamada al backend de la IA
    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
    })
    .then(response => response.json())
    .then(data => {
        if (data.reply) {
            // Formatear la respuesta (manejo básico de saltos de línea y negritas)
            const formattedReply = data.reply
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            modalBody.innerHTML = `
                <div class="patron-detail-content ai-response">
                    <div class="alert alert-info border-0 shadow-sm mb-4">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        Esta respuesta ha sido generada por inteligencia artificial con fines orientativos.
                    </div>
                    <div class="ai-content-text">
                        ${formattedReply}
                    </div>
                    <div class="mt-4 pt-3 border-top">
                        <small class="text-muted">
                            <i class="bi bi-robot me-1"></i>
                            Powered by EKG-LA AI Assistant (Meta Llama 3).
                        </small>
                    </div>
                </div>
            `;
        } else {
            throw new Error('No se recibió respuesta');
        }
    })
    .catch(error => {
        console.error('Error IA:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Lo sentimos, no pudimos conectar con el asistente de IA. Por favor, inténtalo de nuevo más tarde o revisa tu conexión.
            </div>
        `;
    });
};
