# 📖 Guide de Démarrage - CyberPatch Manager Community Edition

Bienvenue dans l'édition communautaire gratuite de **CyberPatch Manager**. Ce guide vous explique comment installer et utiliser les fonctionnalités gratuites.

## 1. Installation

1.  **Téléchargement :** Récupérez le fichier `CyberPatchManager Setup x.x.x.exe` depuis la page [Releases GitHub](https://github.com/GHOSTHUNT-CORP/CyberPatchManager/releases/latest).
2.  **Exécution :** Faites un clic-droit sur l'exécutable et choisissez **"Exécuter en tant qu'administrateur"**.
    *   *Note : Les privilèges administrateur sont obligatoires pour scanner et installer les mises à jour Windows.*
3.  **Premier Démarrage :** L'application va chercher une licence. Ne trouvant pas de fichier `license.key`, elle affichera automatiquement :
    > **Licence : Free (Community Edition)**

## 2. Fonctionnalités Disponibles (Gratuit)

### 🔍 Audit Windows Update
*   Cliquez sur le bouton **"🔍 Rechercher des mises à jour"**.
*   Le logiciel va scanner les serveurs Microsoft (ou votre WSUS local) pour trouver les correctifs manquants.
*   Le tableau affichera : Nom du correctif, KB, Sévérité, et Statut.

### 🛠️ Installation des Patchs
*   Cochez les cases des mises à jour que vous souhaitez installer.
*   Cliquez sur le bouton **"Installer"** ou **"🚀 Tout Installer"**.
*   L'installation se lance en tâche de fond. Un redémarrage peut être requis.

### 🩹 Auto-Guérison (Auto-Heal)
Si Windows Update est bloqué :
1.  Allez dans l'onglet **Ops** (Opérations).
2.  Cliquez sur **"Vider Cache WU"** ou **"Réparer Services"**.
3.  Cela va stopper les services, nettoyer le dossier `SoftwareDistribution` et redémarrer les composants.

## 3. Limitations (Fonctionnalités Verrouillées)

Les fonctionnalités suivantes sont grisées et nécessitent une licence **Pro** ou **Ultimate** :

*   ❌ **Mise à jour des Apps Tierces :** (Chrome, Adobe, etc.) - *Version Pro*
*   ❌ **Scan Réseau (Shadow IT) :** Découverte des machines voisines - *Version Pro*
*   ❌ **War Room :** Isolation réseau et durcissement d'urgence - *Version Ultimate*
*   ❌ **Kit Offline :** Génération de clés USB pour PC déconnectés - *Version Ultimate*

## 4. Support

Cette version est fournie "telle quelle" sans support garanti. Pour signaler un bug, utilisez l'onglet "Issues" sur GitHub.
Pour un support prioritaire, envisagez la version Pro.
