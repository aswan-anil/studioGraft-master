# Unbind all manual steppers
MANUAL_STEPPER STEPPER=motor_a GCODE_AXIS=
MANUAL_STEPPER STEPPER=motor_b GCODE_AXIS=
MANUAL_STEPPER STEPPER=motor_c GCODE_AXIS=
MANUAL_STEPPER STEPPER=motor_d GCODE_AXIS=
MANUAL_STEPPER STEPPER=motor_e GCODE_AXIS=
MANUAL_STEPPER STEPPER=motor_f GCODE_AXIS=
MANUAL_STEPPER STEPPER=motor_g GCODE_AXIS=

# Final rehoming
HOME_S                           ; Re-home special axes (if needed)
HOME_ALL                         ; Re-home all manual steppers
G28                              ; Final full home

