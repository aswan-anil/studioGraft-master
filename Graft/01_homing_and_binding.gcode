G28                              ; Home X, Y, Z axes
HOME_ALL                         ; Home all manual steppers (A-G)
HOME_S                           ; Home custom homing sequence for special axes (if any)

# Bind manual steppers to GCODE axes
MANUAL_STEPPER STEPPER=motor_a GCODE_AXIS=A
MANUAL_STEPPER STEPPER=motor_b GCODE_AXIS=B
MANUAL_STEPPER STEPPER=motor_c GCODE_AXIS=C
MANUAL_STEPPER STEPPER=motor_d GCODE_AXIS=D
MANUAL_STEPPER STEPPER=motor_e GCODE_AXIS=H
MANUAL_STEPPER STEPPER=motor_f GCODE_AXIS=K
MANUAL_STEPPER STEPPER=motor_g GCODE_AXIS=G

