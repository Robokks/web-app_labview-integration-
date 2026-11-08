/* PanelForge curated Phase 1 HMI layouts. All bindings are display-only mock signals.
   These demonstrate visual arrangement only, NOT validated hardware protocols. */
(() => {
  'use strict';
  const make = (id, title, description, icon, accent, summary, items) =>
    Object.freeze({id, title, description, icon, accent, summary, widgets: items.map(([type, label, signal, w=3, h=2]) => ({type, title:label, signal:signal||'', w, h}))});
  window.PanelForgeTemplates = Object.freeze([
    make('motor', 'Motor Test Rig', 'Motor, drive and running-profile monitoring', '⚙', '#0879d2', 'Motor speed, torque, power, drive status and trends', [
      ['section','MOTOR & DRIVE TELEMETRY','',12,1],
      ['numeric','Motor speed','motor.speed',3],['numeric','Output torque','motor.torque',3],['numeric','Output power','motor.power',3],['numeric','Drive current','motor.current',3],
      ['trend','Speed history','motor.speed',8,3],['motor','Drive unit','motor.speed',4,3],
      ['section','OPERATING STATUS','',12,1],
      ['gauge','Motor current','motor.current',4,2],['numeric','Motor temperature','motor.temperature',4,2],['led','Motor running','motor.running',4,2],
      ['profile','Test profile','profile.step',4,2],['result','Test outcome','test.result',4,2],['xy','Speed versus torque','motor.speed',4,2]
    ]),
    make('transmission', 'Transmission Test Rig', 'Input, auxiliary, LH/RH and PTO drivetrain monitoring', '▤', '#7c53b5', 'Multi-shaft speed/torque, gear indication and sequence results', [
      ['section','INPUT & AUXILIARY SHAFTS','',12,1],
      ['numeric','INPUT · Speed','rig.input.speed',3],['numeric','INPUT · Torque','rig.input.torque',3],['numeric','FA LH · Speed','rig.fa_lh.speed',3],['numeric','FA LH · Torque','rig.fa_lh.torque',3],
      ['section','REAR AXLE · LH / RH','',12,1],
      ['numeric','RA LH · Speed','rig.ra_lh.speed',3],['numeric','RA LH · Torque','rig.ra_lh.torque',3],['numeric','RA RH · Speed','rig.ra_rh.speed',3],['numeric','RA RH · Torque','rig.ra_rh.torque',3],
      ['section','GEAR, PTO & TEST STATE','',12,1],
      ['gear','Displayed gear · demo','gear.actual',4,2],['numeric','PTO · Speed','rig.pto.speed',4,2],['numeric','PTO · Torque','rig.pto.torque',4,2],
      ['trend','Input speed trend','rig.input.speed',8,3],['result','Transmission test result','test.result',4,3]
    ]),
    make('steering', 'Steering Gear Test Rig', 'Hydraulic and steering-system condition monitoring', '◈', '#0c8e8c', 'Steering angle, pressure, oil flow and temperature', [
      ['section','STEERING SYSTEM FEEDBACK','',12,1],
      ['numeric','Steering angle','steer.angle',3],['numeric','Measured torque','steer.torque',3],['numeric','Hydraulic pressure','steer.pressure',3],['numeric','Oil flow','steer.oil_flow',3],
      ['trend','Steering angle history','steer.angle',8,3],['gauge','Hydraulic pressure','steer.pressure',4,3],
      ['section','HYDRAULIC & TEST STATE','',12,1],
      ['numeric','Oil temperature','steer.oil_temp',4],['numeric','Actuator position','steer.position',4],['led','Hydraulic ready','steer.ready',4],
      ['profile','Current test step','profile.step',6],['result','Steering test result','test.result',6]
    ]),
    make('dynamometer', 'Dynamometer Test Rig', 'Chassis/drive dynamometer measurement overview', '◉', '#d16f22', 'RPM, wheel/shaft torque, load, power and measurement trends', [
      ['section','DYNAMOMETER READOUTS','',12,1],
      ['numeric','Shaft speed','dyno.speed',3],['numeric','Measured torque','dyno.torque',3],['numeric','Absorbed power','dyno.power',3],['numeric','Load percentage','dyno.load',3],
      ['gauge','Load indicator','dyno.load',4,3],['trend','RPM trend','dyno.speed',8,3],
      ['section','STAND STATUS & RESULTS','',12,1],
      ['numeric','Oil temperature','dyno.temperature',3],['numeric','Ambient temperature','dyno.ambient',3],['led','Rig ready','dyno.ready',3],['result','Test evaluation','test.result',3],
      ['xy','Speed versus torque','dyno.speed',8,3],['profile','Test profile step','profile.step',4,3]
    ]),
    make('general', 'General Industrial HMI', 'Reusable display-only dashboard for other rig types', '▦', '#398750', 'A clean starter layout for numeric, Boolean, chart and profile widgets', [
      ['section','LIVE MEASUREMENTS','',12,1],
      ['numeric','Process temperature','plant.temperature',3],['numeric','Line pressure','plant.pressure',3],['numeric','Flow rate','plant.flow',3],['numeric','Measured level','plant.level',3],
      ['trend','Pressure history','plant.pressure',8,3],['gauge','Line pressure','plant.pressure',4,3],
      ['section','SYSTEM STATUS','',12,1],
      ['led','System healthy','plant.healthy',4],['profile','Current operation','plant.operation',4],['result','Inspection result','test.result',4],
      ['numeric','Process value A','plant.value_a',4],['numeric','Process value B','plant.value_b',4],['numeric','Process value C','plant.value_c',4]
    ])
  ]);
})();
