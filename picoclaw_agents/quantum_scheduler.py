"""
⚛️ Atena Quantum Scheduler — Quantum-Inspired Task Allocation
Usa lo stato GHZ a N qubit (pyqpanda3) per generare correlazioni quantistiche
che determinano l'ordine di esecuzione ottimale degli agenti del swarm.

Principio: Lo stato GHZ |000...0⟩ + |111...1⟩ crea correlazioni perfette.
Nella misurazione, tutti i qubit collassano allo stesso valore.
Usiamo misurazioni ripetute per generare un "bias quantistico" che
bilancia il carico tra agenti in modo non-deterministico ma correlato.
"""
import sys
import os
import time
from datetime import datetime

# Prova a importare pyqpanda3 (potrebbe non essere nel PATH globale)
try:
    sys.path.insert(0, os.path.join(os.path.expanduser("~"), "Desktop", "quantum-ghz", ".venv", "Lib", "site-packages"))
    from pyqpanda3.core import QCircuit, QProg, CPUQVM, Qubit, CBit, H, CNOT, measure
    QUANTUM_AVAILABLE = True
except ImportError:
    QUANTUM_AVAILABLE = False
    print("[QS] ⚠️ pyqpanda3 non trovato. Fallback a scheduling classico.")


class QuantumScheduler:
    """
    Scheduler che usa un circuito quantistico GHZ per determinare
    l'ordine di esecuzione e il raggruppamento degli agenti.
    
    Con N agenti, crea uno stato GHZ a N qubit.
    Le misurazioni determinano quali agenti partono insieme (correlati)
    e quali aspettano il turno successivo.
    """
    
    def __init__(self, agent_names: list):
        self.agent_names = agent_names
        self.n_agents = len(agent_names)
        self.schedule = []
        
    def create_ghz_circuit(self, n_qubits: int):
        """Crea un circuito GHZ a N qubit."""
        qubits = [Qubit(i) for i in range(n_qubits)]
        cbits = [CBit(i) for i in range(n_qubits)]
        
        circuit = QCircuit()
        # Hadamard sul primo qubit
        circuit << H(qubits[0])
        # CNOT a cascata per creare entanglement
        for i in range(n_qubits - 1):
            circuit << CNOT(qubits[i], qubits[i + 1])
        
        prog = QProg()
        prog << circuit
        for i in range(n_qubits):
            prog << measure(qubits[i], cbits[i])
        
        return prog
    
    def quantum_schedule(self, shots: int = 100) -> list:
        """
        Genera lo schedule usando misurazioni quantistiche.
        
        Strategia: 
        - Eseguiamo il circuito GHZ molte volte
        - Per ogni misurazione, i qubit a |1⟩ indicano agenti di "priorità alta"
        - La frequenza con cui ogni agente appare come "prioritario" determina la wave
        """
        if not QUANTUM_AVAILABLE:
            return self.classical_fallback()
        
        print(f"[QS] ⚛️ Quantum Scheduling per {self.n_agents} agenti ({shots} shots)...")
        
        prog = self.create_ghz_circuit(self.n_agents)
        qvm = CPUQVM()
        qvm.run(prog, shots)
        result = qvm.result().get_counts()
        
        print(f"[QS] Risultati misurazione: {result}")
        
        # Analisi: conta quante volte ogni posizione è |1⟩
        priority_scores = [0] * self.n_agents
        total = sum(result.values())
        
        for state, count in result.items():
            for i, bit in enumerate(state):
                if bit == '1':
                    priority_scores[i] += count
        
        # Normalizza i punteggi
        priority_scores = [s / total for s in priority_scores]
        
        # Crea schedule basato sui punteggi quantistici
        # Agenti con punteggio > 0.5 vanno nella Wave 1 (parallelo)
        # Agenti con punteggio <= 0.5 vanno nella Wave 2
        wave1 = []
        wave2 = []
        
        for i, (agent, score) in enumerate(zip(self.agent_names, priority_scores)):
            if score > 0.45:  # Soglia per Wave 1
                wave1.append(agent)
            else:
                wave2.append(agent)
        
        # Se una wave è vuota, bilancia
        if not wave1:
            wave1 = [self.agent_names[0]]
            wave2 = self.agent_names[1:]
        if not wave2:
            mid = len(wave1) // 2
            wave2 = wave1[mid:]
            wave1 = wave1[:mid]
        
        self.schedule = [wave1, wave2]
        
        print(f"[QS] 🌊 Wave 1 (parallelo): {wave1}")
        print(f"[QS] 🌊 Wave 2 (parallelo): {wave2}")
        print(f"[QS] Priority scores: {dict(zip(self.agent_names, [f'{s:.2f}' for s in priority_scores]))}")
        
        return self.schedule
    
    def classical_fallback(self) -> list:
        """Fallback classico: divide gli agenti in 2 wave uguali."""
        print("[QS] 📋 Usando scheduling classico (round-robin)...")
        mid = len(self.agent_names) // 2
        self.schedule = [
            self.agent_names[:mid],
            self.agent_names[mid:]
        ]
        return self.schedule
    
    def get_execution_plan(self) -> dict:
        """Restituisce un piano di esecuzione strutturato."""
        if not self.schedule:
            self.quantum_schedule()
        
        return {
            "scheduler": "quantum" if QUANTUM_AVAILABLE else "classical",
            "n_agents": self.n_agents,
            "n_waves": len(self.schedule),
            "waves": {
                f"wave_{i+1}": {
                    "agents": wave,
                    "parallel": True,
                    "estimated_time_minutes": len(wave) * 15  # ~15 min per agent
                }
                for i, wave in enumerate(self.schedule)
            },
            "total_estimated_minutes": sum(len(w) * 15 for w in self.schedule) // 2,  # Parallel saves ~50%
            "timestamp": datetime.now().isoformat()
        }


def demo():
    """Demo del quantum scheduler."""
    agents = [
        "CivilCodeAgent",
        "PenalCodeAgent", 
        "EurLexAgent",
        "GazzettaAgent"
    ]
    
    print("=" * 60)
    print("  ⚛️ ATENA QUANTUM SCHEDULER — Demo")
    print("=" * 60)
    print()
    
    scheduler = QuantumScheduler(agents)
    schedule = scheduler.quantum_schedule(shots=200)
    
    print()
    plan = scheduler.get_execution_plan()
    print(f"  Scheduler: {plan['scheduler']}")
    print(f"  Waves: {plan['n_waves']}")
    print(f"  Tempo stimato: ~{plan['total_estimated_minutes']} minuti")
    print()
    
    return plan


if __name__ == "__main__":
    demo()
