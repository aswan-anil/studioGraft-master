# Coordinated stepper movements
G1 C52 K15 F3000                ; Move motor C and K
G1 H25 Z40 F1500                ; Move H and Z axes
G1 H10 F1500                    ; Move motor E to position 10
G1 K45 F3000                    ; Move motor K to position 45
G1 H25 F1500                    ; Move motor E to position 25
G1 H10 F1500                    ; Back to H10 (repeat move)

