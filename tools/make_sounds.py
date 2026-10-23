"""Original cinematic holographic SFX. No anime recordings or copyrighted audio samples."""
from pathlib import Path
import wave
import numpy as np
from scipy.ndimage import gaussian_filter1d

RATE=24000
rng=np.random.default_rng(8731)
folder=Path(__file__).resolve().parents[1]/'sounds'
folder.mkdir(exist_ok=True)
def build(name,length,fn,peak=.61):
    a=np.zeros(int(RATE*length),dtype=np.float64)
    def osc(start,dur,f0,f1=None,volume=.1,waveform='sine',attack=.006,decay=3,vibrato=0):
        s=int(start*RATE); e=min(len(a),s+int(dur*RATE))
        if e<=s:return
        t=np.arange(e-s)/RATE; f1=f0 if f1 is None else f1
        f=f0*np.exp(np.log(max(1,f1)/max(1,f0))*t/max(dur,1e-6))
        if vibrato:f*=1+.008*np.sin(2*np.pi*vibrato*t)
        phase=2*np.pi*np.cumsum(f)/RATE
        v=np.sin(phase) if waveform=='sine' else (
          (2/np.pi)*np.arcsin(np.sin(phase)) if waveform=='triangle' else
          np.tanh(1.5*(np.sin(phase)+.28*np.sin(phase*2)+.12*np.sin(phase*3))))
        envelope=(1-np.exp(-t/max(.0001,attack)))*np.exp(-decay*t/max(dur,.001))
        a[s:e]+=volume*v*envelope
    def bell(start,f,dur,vol=.16):
        for ratio,g,dec in [(1,1,2.0),(2.002,.42,3.8),(3.1,.17,5),(5.05,.07,7.2)]:
            osc(start,dur,f*ratio,volume=vol*g,attack=.003,decay=dec)
    def hiss(start,dur,vol=.1,mode='high',decay=3.8):
        s=int(start*RATE);e=min(len(a),s+int(dur*RATE))
        if e<=s:return
        t=np.arange(e-s)/RATE
        w=rng.normal(size=e-s)
        blur=gaussian_filter1d(w,7)
        w=w-blur if mode=='high' else gaussian_filter1d(w,3)
        env=(1-np.exp(-t/.004))*np.exp(-decay*t/max(dur,.001))
        a[s:e]+=vol*w*env
    fn(osc,bell,hiss)
    # Stereo reflections give glassy space; soften start/end to avoid clicks
    pad=3000; a=np.pad(a,(0,pad))
    l=a.copy();r=a.copy()
    for dt,g in [(0.062,.14),(0.123,.085),(0.201,.065)]:
        k=int(dt*RATE); l[k:]+=a[:-k]*g
    for dt,g in [(0.078,.17),(0.169,.075),(0.236,.05)]:
        k=int(dt*RATE);r[k:]+=a[:-k]*g
    for x in (l,r):
        x[-500:]*=np.linspace(1,0,500)
    data=np.stack((l,r),axis=1)
    data=np.tanh(data*1.75)
    maxv=np.max(np.abs(data))
    if maxv>0:data*=peak/maxv
    target=folder/(name+'.wav')
    with wave.open(str(target),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE)
        w.writeframes(np.int16(np.clip(data,-1,1)*32767).tobytes())
    print(f'{name:10} {target.stat().st_size:>7} B | {len(data)/RATE:.2f} s')
# Graceful cyber-glass system sounds, not stock game bleeps.
build('nav',.23,lambda o,b,h:(b(0,940,.18,.19),o(.025,.19,1260,1450,.07),h(0,.09,.017)))
build('click',.16,lambda o,b,h:(o(0,.11,710,935,.085,decay=5),h(0,.07,.012)))
build('close',.27,lambda o,b,h:(o(0,.23,960,420,.17,decay=2.6),b(.025,790,.18,.055),h(.005,.1,.018)))
build('point',.46,lambda o,b,h:(b(0,1110,.31,.25),b(.075,1660,.3,.18),o(0,.26,520,1100,.075),h(0,.08,.025)))
build('buy',.55,lambda o,b,h:(b(0,920,.3,.22),b(.11,1360,.34,.21),b(.20,1760,.28,.11),h(.02,.17,.023)))
build('quest',1.22,lambda o,b,h:(h(0,.45,.04),o(.02,.7,170,450,.14,decay=2),b(.08,592,.7,.23),b(.25,790,.7,.23),b(.49,1184,.7,.24),o(.34,.8,280,570,.07)))
build('victory',1.7,lambda o,b,h:(h(0,.5,.055),o(0,.7,90,200,.27,decay=3),b(.07,659,1.1,.18),b(.32,880,1.2,.23),b(.59,1175,1.1,.25),b(.82,1568,.85,.19),o(.25,1.05,395,880,.12)))
build('level',2.25,lambda o,b,h:(o(0,1.05,65,215,.33,decay=2.3),h(0,.8,.09),o(.18,1.42,280,920,.22,decay=1.8,vibrato=5),b(.26,440,1.5,.19),b(.46,587.3,1.6,.22),b(.67,880,1.45,.24),b(.89,1174.7,1.2,.27),b(1.14,1760,.96,.23),h(1.0,.65,.06)))
build('gate',2.3,lambda o,b,h:(o(0,2.05,54,108,.36,waveform='rough',attack=.04,decay=1.8),o(.07,1.68,250,57,.23,waveform='rough',attack=.18,decay=1.3),o(.28,1.4,420,205,.14,vibrato=7,decay=2),h(0,1.6,.22,mode='low',decay=1.8),h(.22,1.55,.055),b(1.05,240,.73,.10)))
build('attack',.59,lambda o,b,h:(h(0,.34,.24),o(.015,.22,600,100,.20,waveform='rough',decay=4.2),o(.09,.28,96,48,.28,decay=5),h(.1,.22,.19,mode='low')))
build('skill',1.54,lambda o,b,h:(o(0,1.0,220,1640,.20,waveform='rough',attack=.03,decay=1.5,vibrato=9),h(.04,.9,.12,decay=1.2),o(.62,.72,1460,270,.20,waveform='rough',decay=3),o(.73,.55,90,48,.32),b(.82,1350,.58,.17)))
build('damage',.70,lambda o,b,h:(o(0,.41,135,52,.31,waveform='rough',decay=5),h(0,.40,.23,mode='low'),h(0,.25,.09)))
build('error',.95,lambda o,b,h:(o(0,.3,208,166,.20,waveform='rough'),o(.35,.36,208,146,.24,waveform='rough'),h(.02,.18,.055),h(.37,.19,.064)))
build('welcome',1.9,lambda o,b,h:(h(0,.5,.07),o(0,1.4,60,180,.27,waveform='rough',attack=.035),o(.18,1.4,380,720,.16,decay=1.7,vibrato=3),b(.43,523,1.15,.20),b(.64,784,1.08,.22),b(.87,1046,.93,.19),h(.82,.56,.05)))
