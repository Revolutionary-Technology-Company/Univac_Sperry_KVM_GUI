import tkinter as tk
from tkinter import font

class TransparentOLED(tk.Toplevel):
    def __init__(self, parent, saved_state=False):
        super().__init__(parent)
        self.title("LG 55 T-OLED Signage")
        self.geometry("1920x1080+0+0")
        self.overrideredirect(True) # Frameless
        self.configure(bg="#D3D3D3") # Univac Matte Grey
        self.saved_state = saved_state
        
        # Colors
        self.c_univac = "#D3D3D3"
        self.c_tape_blue = "#1D70B8"
        self.c_alert_red = "#FF0000"
        self.c_safe_green = "#00FF00"
        
        self.create_layout()

    def create_layout(self):
        # --- Top Status Bar ---
        status_bg = self.c_safe_green if self.saved_state else self.c_alert_red
        status_fg = "black" if self.saved_state else "white"
        status_text = "1 - SAVED" if self.saved_state else "0 - UNSAVED GANTRY CODE"
        
        self.lbl_status = tk.Label(self, text=status_text, bg=status_bg, fg=status_fg, 
                                   font=("Courier", 24, "bold"), height=2)
        self.lbl_status.pack(side="top", fill="x")

        # --- Main Container ---
        container = tk.Frame(self, bg=self.c_univac)
        container.pack(expand=True, fill="both")
        
        # Calculate center hole (701px square)
        # Screen: 1920w, Sq: 701w. Margin = (1920-701)/2 = 609.5
        
        # Left Keyboard Panel (Non-QWERTY Split)
        f_left = tk.Frame(container, bg=self.c_univac, width=600)
        f_left.pack(side="left", fill="y", padx=50)
        self.build_keypad(f_left, "ABCDEFGHIJKLM01234")

        # --- CENTER HOLE FOR EXISTING KVM ---
        # We use a black canvas to represent the 'transparent' or pass-through area
        # In a real overlay, you might set this color to a chroma-key or 
        # position your window around it.
        self.kvm_hole = tk.Frame(container, bg="black", width=701, height=701)
        self.kvm_hole.pack(side="left", padx=10)
        self.kvm_hole.pack_propagate(False)
        
        lbl_insert = tk.Label(self.kvm_hole, text="EXISTING KVM\nMODULE RENDER", fg="#333333", bg="black")
        lbl_insert.place(relx=0.5, rely=0.5, anchor="center")

        # Right Keyboard Panel
        f_right = tk.Frame(container, bg=self.c_univac, width=600)
        f_right.pack(side="left", fill="y", padx=50)
        self.build_keypad(f_right, "NOPQRSTUVWXYZ56789")

        # --- Bottom Send Bar ---
        btn_send = tk.Button(self, text="SEND TRANSMISSION", bg=self.c_tape_blue, fg="white",
                             font=("Helvetica", 20, "bold"), height=3, relief="flat")
        btn_send.pack(side="bottom", fill="x")
        
    def build_keypad(self, parent, chars):
        # 2-column vertical grid for split keys
        for i, char in enumerate(chars):
            row = i // 2
            col = i % 2
            btn = tk.Button(parent, text=char, width=6, height=2, 
                            font=("Arial", 18, "bold"), bg="#B0C4DE")
            btn.grid(row=row, column=col, padx=10, pady=10)
