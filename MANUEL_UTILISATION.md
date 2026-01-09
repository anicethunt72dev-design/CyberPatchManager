# 📘 MANUEL D'UTILISATION - CyberPatchManager Enterprise
**Version :** 2.0 (Édition Sécurité Défensive & IA)  
**Dernière mise à jour :** Janvier 2026

---

## 📋 Table des Matières
1. [Introduction & Philosophie](#1-introduction--philosophie)
2. [Installation & Démarrage](#2-installation--démarrage)
3. [Tableau de Bord SOC & Reporting](#3-tableau-de-bord-soc--reporting)
4. [Gestion des Correctifs & IA](#4-gestion-des-correctifs--ia)
5. [Opérations de Sécurité (SecOps)](#5-opérations-de-sécurité-secops)
6. [Écosystème & Mode Déconnecté](#6-écosystème--mode-déconnecté)
7. [Dépannage & FAQ](#7-dépannage--faq)

---

## 1. Introduction & Philosophie
**CyberPatchManager** n'est plus un simple outil de mise à jour. C'est une **suite de gouvernance et de défense active**. Elle est conçue pour les administrateurs systèmes et les équipes SOC qui doivent maintenir la conformité ISO 27001 et réagir rapidement aux menaces (Zero-Day).

### Capacités Clés :
*   **Heuristique Locale :** Une IA qui apprend des échecs passés pour éviter de casser la production.
*   **Défense Active :** Capacité d'isoler une machine (Quarantaine) en cas d'attaque.
*   **Visibilité SOC :** Scores de risque en temps réel et Heatmap des vulnérabilités.

---

## 2. Installation & Démarrage
### Compatibilité Multi-Plateforme (Nouveau)
CyberPatchManager est désormais compatible avec les environnements suivants :
*   **Windows :** Windows 10/11, Server 2016/2019/2022 (Architectures x64, x86, ARM64).
*   **macOS :** macOS 12+ (Intel & Apple Silicon M1/M2/M3).
*   **Linux :** Distributions basées sur Debian (Ubuntu, Kali) et RHEL (Fedora, CentOS).

### Prérequis
*   **Droits :** Privilèges **Administrateur** (Windows) ou **Root/Sudo** (Linux/macOS) obligatoires.
*   **Connexion :** Internet (pour le téléchargement) ou Kit Offline.

### Installation
#### Sur Windows
1.  Exécutez `CyberPatchManager Setup 1.0.0.exe`.
2.  L'installateur détectera automatiquement votre architecture (x64, x86 ou ARM64).

#### Sur macOS
1.  Ouvrez le fichier `.dmg`.
2.  Glissez l'application dans le dossier `Applications`.

#### Sur Linux
1.  Utilisez le paquet `.deb` (Debian/Ubuntu) ou `.rpm` (RHEL/Fedora).
2.  Ou rendez le fichier `.AppImage` exécutable (`chmod +x`) et lancez-le.

### Premier Lancement
1.  Au lancement, l'application effectue un auto-diagnostic.
2.  **Note Importante :** Le moteur de correctifs accepte désormais automatiquement les licences (EULA) pour les mises à jour critiques (ex: Microsoft Defender), facilitant le déploiement silencieux.
3.  **Entreprise :** Configurez la **Politique de Gouvernance** dans l'onglet *Sécurité*.

---

## 3. Tableau de Bord SOC & Reporting
Accessible via le bouton **"📊 Reporting & SOC"**.

### Indicateurs Clés
*   **Score de Risque (0-100) :** Calculé dynamiquement.
    *   *Facteurs :* Sévérité des patchs manquants + Menaces actives (CISA) + Services critiques exposés.
    *   *Vert (<20) :* Sain.
    *   *Rouge (>50) :* Action requise immédiate.
*   **Indice de Maturité :** Reflète votre "Dette Technique". Plus il est haut, mieux votre parc est géré.
*   **Heatmap (Cartographie) :** Une grille visuelle représentant chaque correctif. Les cases rouges indiquent des failles critiques.

### Exportation
*   **Rapport de Conformité (CSV) :** Cliquez sur "Exporter CSV" pour générer un document auditable (compatible ISO 27001), incluant le score de risque et la liste des failles.

---

## 4. Gestion des Correctifs & IA
### Scan Intelligent
1.  Cliquez sur **"🔍 Rechercher des mises à jour"**.
2.  L'IA analyse chaque correctif trouvé.

### Auto-Priorité IA (Nouveau)
Ne perdez plus de temps à trier manuellement.
1.  Cliquez sur le bouton bleu **"🧠 Auto-Priorité IA"**.
2.  L'algorithme sélectionne automatiquement les patchs ayant un score > 60.
    *   *Critères IA :* Faille exploitée (CISA), Service critique impacté (ex: IIS, SQL), Stabilité historique.

### Prédiction d'Impact
Avant l'installation, observez les cartes :
*   **⚠️ Risque Prédit :** L'IA vous avertit si ce patch a déjà échoué par le passé ou s'il s'agit d'une version instable ("Preview").
*   **🛑 ARRÊT SERVICE REQUIS :** L'IA détecte si le patch va couper un service en production (ex: Exchange, Hyper-V).

---

## 5. Opérations de Sécurité (SecOps)
Accessible via le bouton **"🛡️ Sécurité & Gouvernance"**.

### Mode Urgence Cyber (Panic Button)
**À N'UTILISER QU'EN CAS D'ATTAQUE IMMINENTE.**
Le bouton rouge **"🚨 URGENCE CYBER"** (visible si failles critiques) déclenche une séquence automatisée :
1.  **Isolation Réseau :** Coupe tout trafic sauf RDP (Quarantaine).
2.  **Ciblage :** Sélectionne 100% des correctifs de sécurité critiques.
3.  **Patching Forcé :** Lance l'installation sans demande de confirmation supplémentaire.

### Mode Silencieux
Activez l'interrupteur dans l'en-tête pour désactiver toutes les notifications de bureau. Idéal pour les interventions sur les postes utilisateurs.

---

## 6. Écosystème & Mode Déconnecté
Accessible via le bouton **"🌐 Intégrations"**.

### Mode Air-Gap (Sites Isolés)
Pour les machines sans internet (Usines, Zones Militaires) :
1.  Sur une machine connectée : Cliquez sur **"📦 Générer Kit Offline"**.
2.  Copiez le dossier généré sur une clé USB sécurisée.
3.  Exécutez le script `Install-Offline.ps1` sur la machine cible.

### Webhook & SIEM
Connectez l'outil à votre supervision (Splunk, GLPI, Slack, Teams).
*   Entrez l'URL du Webhook.
*   Les événements (Succès, Échec, Quarantaine) sont envoyés en JSON.

---

## 7. Dépannage & FAQ

**Q: Pourquoi l'installation échoue-t-elle ?**
R: Vérifiez que le service "Windows Update" n'est pas désactivé par GPO. Consultez les logs via le bouton "📋 Audit Logs".

**Q: L'IA envoie-t-elle mes données dans le cloud ?**
R: **NON.** L'IA est purement locale (Heuristique). Aucune donnée ne sort de votre machine, garantissant la confidentialité totale.

**Q: Comment lever la quarantaine ?**
R: Retournez dans l'onglet Sécurité et cliquez sur "🔓 LEVER ISOLATION".

---
**Support Technique :**  yao.kouakou.dev@gmail.com  
**Tél / WhatsApp :** +225 0140094507 / +225 0789696146  
**Développé par :** Yao Kouakou Luc Anicet Beranger © 2026
