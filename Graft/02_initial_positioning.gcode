# Initial positioning
G1 Y330 F3000                    ; Move Y-axis forward
G4 P3000                         ; Wait 3 seconds

# Initial servo setup
SERVO_MOVE SERVO_ID=1 POSITION=168 SPEED=1000
SERVO_MOVE SERVO_ID=3 POSITION=36 SPEED=1000
SERVO_MOVE SERVO_ID=5 POSITION=2300 SPEED=1000
SERVO_MOVE SERVO_ID=4 POSITION=2563 SPEED=1000

G1 X170 Y198 F3000              ; Move to start position
G4 P2000                         ; Wait 2 seconds

