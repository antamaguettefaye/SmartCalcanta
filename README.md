# Calculatrice Scientifique - Guide d'Installation

## 📁 Structure du Projet

Votre projet contient 3 fichiers principaux :

```
calculatrice/
├── calculatrice.html    (fichier principal)
├── styles.css          (styles et design)
└── script.js           (logique de la calculatrice)
```

## 🚀 Comment Lancer la Calculatrice

### Méthode 1 : Ouvrir directement dans le navigateur (RECOMMANDÉ)

1. **Téléchargez les 3 fichiers** dans le même dossier sur votre ordinateur
2. **Double-cliquez** sur le fichier `calculatrice.html`
3. La calculatrice s'ouvrira directement dans votre navigateur par défaut

### Méthode 2 : Glisser-Déposer

1. Placez les 3 fichiers dans le même dossier
2. Faites glisser le fichier `calculatrice.html` dans une fenêtre de navigateur
3. La calculatrice s'affichera immédiatement

### Méthode 3 : Héberger sur un serveur local (Pour les développeurs)

Si vous voulez tester avec un serveur local :

**Avec Python 3 :**
```bash
cd chemin/vers/le/dossier
python -m http.server 8000
```
Puis ouvrez : http://localhost:8000/calculatrice.html

**Avec Node.js (http-server) :**
```bash
npm install -g http-server
cd chemin/vers/le/dossier
http-server
```
Puis ouvrez : http://localhost:8080/calculatrice.html

## ✨ Fonctionnalités

### Mode Basique
- ✅ Opérations arithmétiques (+, -, ×, ÷)
- ✅ Pourcentages
- ✅ Inversion de signe (±)
- ✅ Touche Backspace
- ✅ Fonctions mémoire (MC, MR, M+, M-)

### Mode Scientifique
- ✅ Fonctions trigonométriques (sin, cos, tan)
- ✅ Fonctions hyperboliques (sinh, cosh, tanh)
- ✅ Fonctions inverses (sin⁻¹, cos⁻¹, tan⁻¹)
- ✅ Logarithmes (log, ln, log₂)
- ✅ Puissances et racines (x², x³, xʸ, √, ∛)
- ✅ Constantes (π, e)
- ✅ Factorielle (n!)
- ✅ Valeur absolue (|x|)
- ✅ Modulo (mod)
- ✅ Unités d'angle (DEG, RAD, GRAD)
- ✅ Notation scientifique (F-E)

### Autres Fonctionnalités
- 🌙 Mode sombre / clair
- 📜 Historique des calculs
- ⌨️ Support clavier complet
- ↩️ Annuler / Rétablir
- 📋 Copier le résultat
- 💾 Sauvegarde automatique de l'état
- 📱 Design responsive (mobile, tablette, desktop)

## ⌨️ Raccourcis Clavier

| Touche | Action |
|--------|--------|
| 0-9 | Chiffres |
| . ou , | Point décimal |
| +, -, *, / | Opérations |
| ( ) | Parenthèses |
| Enter ou = | Calculer |
| Backspace | Effacer le dernier caractère |
| Escape | Tout effacer (AC) |
| Ctrl + Z | Annuler |
| Ctrl + Y | Rétablir |
| p | Insérer π |
| e | Insérer e (en mode scientifique) |
| a | Insérer Ans |

## 🎨 Personnalisation

### Changer le thème par défaut

Dans `script.js`, ligne 73, modifiez :
```javascript
const savedTheme = localStorage.getItem('calcTheme') || 'dark';
```
Changez `'dark'` en `'light'` pour un thème clair par défaut.

### Changer le mode par défaut

Dans `script.js`, ligne 75, modifiez :
```javascript
mode = localStorage.getItem('calcLastMode') || 'scientific';
```
Changez `'scientific'` en `'basic'` pour démarrer en mode basique.

## 🔧 Dépannage

### La calculatrice ne s'affiche pas correctement
- Vérifiez que les 3 fichiers sont dans le même dossier
- Assurez-vous d'avoir une connexion internet (pour Font Awesome)
- Essayez de vider le cache du navigateur (Ctrl + F5)

### Les calculs ne fonctionnent pas
- Ouvrez la console du navigateur (F12) pour voir les erreurs
- Vérifiez que JavaScript est activé dans votre navigateur
- Essayez avec un navigateur différent (Chrome, Firefox, Edge)

### L'historique ne se sauvegarde pas
- Vérifiez que le localStorage est activé dans votre navigateur
- Certains navigateurs en mode privé bloquent le localStorage

## 🌐 Compatibilité Navigateurs

✅ Chrome / Edge (version 90+)
✅ Firefox (version 88+)
✅ Safari (version 14+)
✅ Opera (version 76+)

## 📝 Notes Importantes

1. **Les 3 fichiers doivent être dans le MÊME dossier** pour que la calculatrice fonctionne
2. Le fichier HTML charge Font Awesome depuis un CDN (nécessite une connexion internet)
3. Les données (historique, mémoire, thème) sont sauvegardées dans le localStorage du navigateur
4. La calculatrice est entièrement fonctionnelle hors ligne (sauf pour l'icône FontAwesome)

## 💡 Exemples d'Utilisation

### Calculs Simples (Mode Basique)
- `15 + 25 =` → 40
- `100 - 35 =` → 65
- `12 × 8 =` → 96
- `144 ÷ 12 =` → 12

### Calculs Scientifiques (Mode Scientifique)
- `sin(30) =` → 0.5 (en mode DEG)
- `log(100) =` → 2
- `2^8 =` → 256
- `sqrt(144) =` → 12
- `5! =` → 120

### Expressions Complexes
- `(2 + 3) * (4 - 1) =` → 15
- `sin(45)^2 + cos(45)^2 =` → 1 (en mode DEG)
- `ln(e^3) =` → 3

## 🎯 Conseils d'Utilisation

1. **Bouton 2nd** : Active les fonctions secondaires (affichées au-dessus des boutons)
2. **DRG** : Change entre Degrés, Radians et Gradians
3. **F-E** : Bascule entre notation normale et scientifique
4. **Ans** : Utilise le résultat du dernier calcul
5. **M+/M-** : Ajoute/soustrait de la mémoire
6. **MR** : Rappelle la valeur en mémoire
7. **MC** : Efface la mémoire

## 📄 Licence

Ce projet est libre d'utilisation pour un usage personnel et éducatif.

---

**Créé avec ❤️ - Calculatrice Scientifique Complète**
