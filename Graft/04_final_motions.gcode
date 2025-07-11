# Final coordinated moves
G1 K5 C5 F1000                  ; Reset motors K and C to 5
SERVO_MOVE SERVO_ID=3 POSITION=563 SPEED=1000
SERVO_MOVE SERVO_ID=5 POSITION=2835 SPEED=1000

G1 Y100 F3000                   ; Move Y-axis back
G1 A22 B22 Y0 F3000             ; Move steppers A, B, and Y
SERVO_MOVE SERVO_ID=2 POSITION=1257 SPEED=1000
G1 D28 G28 H25 F3000            ; Final positions for D, G, and H
SERVO_MOVE SERVO_ID=2 POSITION=1899 SPEED=1000
G4 P2000                         ; Wait 2 seconds

