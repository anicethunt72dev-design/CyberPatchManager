# 🛡️ CyberPatchManager - Enterprise Security Suite

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg) ![Platform](https://img.shields.io/badge/platform-Win%20%7C%20Mac%20%7C%20Linux-0078D6.svg) ![Arch](https://img.shields.io/badge/arch-x64%20%7C%20ARM64-orange) ![License](https://img.shields.io/badge/license-Commercial-red.svg)

**CyberPatchManager** est une solution de gouvernance des correctifs et de défense active multi-plateforme. Elle sécurise vos infrastructures Windows, macOS et Linux grâce à une intelligence heuristique locale.

---

## 🔥 Fonctionnalités Clés

### 🧠 Intelligence Artificielle & Automatisation
*   **Auto-Priorisation IA :** Algorithme de scoring (0-100) basant la priorité sur la sévérité, les menaces actives (CISA KEV) et le contexte des services.
*   **Apprentissage Local :** Base de données historique qui apprend des échecs passés pour prévenir les futurs incidents.
*   **Prédiction d'Impact :** Détection proactive des services critiques (SQL, IIS, Exchange) qui seront impactés par un correctif.

### 🛡️ Sécurité Défensive (SecOps)
*   **Quarantaine Réseau :** Isolation immédiate d'une machine compromise (blocage du trafic sauf RDP/WinRM).
*   **Mode Urgence Cyber :** "Panic Button" pour les attaques Zero-Day (Isolation + Patching Forcé).
*   **Gouvernance :** Définition de politiques (Standard/Critique) avec validation humaine par mot de passe.

### 📊 Reporting SOC & Conformité
*   **Dashboard SOC :** Score de Risque en temps réel, Indice de Maturité, et Heatmap des vulnérabilités.
*   **Audit Trail :** Journal d'audit immuable (JSON) de toutes les actions administratives.
*   **Rapports ISO 27001 :** Export PDF et CSV formaté pour les audits de sécurité.

### 🌐 Écosystème & Déploiement
*   **Mode Air-Gap :** Générateur de Kit Offline pour les environnements déconnectés.
*   **Intégration SIEM :** Webhooks pour connecter Splunk, ServiceNow, GLPI, etc.
*   **Gestion App Tiers :** Mise à jour centralisée via Winget.

---

## 🚀 Installation

1.  Téléchargez la dernière version (`.exe`) depuis la section Releases.
2.  Exécutez l'installeur en tant qu'**Administrateur**.
3.  Configurez votre politique de sécurité au premier lancement.

---

## 📖 Utilisation Rapide

1.  **Scan :** Cliquez sur `🔍 Rechercher des mises à jour`.
2.  **Analyse :** Utilisez le bouton `🧠 Auto-Priorité IA` pour laisser le système sélectionner les patchs critiques.
3.  **Action :** Cliquez sur `Mettre à jour` individuellement ou `🚀 Tout Installer` pour un traitement par lot.
4.  **Rapport :** Exportez le résultat via `📊 Reporting` -> `Exporter CSV`.

*Pour plus de détails, consultez le [MANUEL_UTILISATION.md](./MANUEL_UTILISATION.md).*

---

## 🏗️ Architecture Technique

*   **Frontend :** Electron, HTML5/CSS3 (Dashboard réactif).
*   **Backend :** Node.js (Orchestration), PowerShell (Moteur d'exécution natif).
*   **Données :** JSON local (Persistance légère & rapide).
*   **Sécurité :** Exécution de scripts signés (conceptuel), pas de dépendance Cloud.

---

## 📄 Licence & Crédits

Ce logiciel est distribué sous **Licence Commerciale Professionnelle**.
Copyright © 2026 **Yao Kouakou Luc Anicet Beranger**.

**Contacts :**
*   **Email :** yao.kouakou.dev@gmail.com
*   **WhatsApp :** +225 0140094507
*   **WhatsApp Business :** +225 0789696146

Voir le fichier [LICENSE](./LICENSE) pour les termes complets.
