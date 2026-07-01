# Notes de sécurité — PMO NARSA

## Authentification (T0.3, exig. 37)

- **Politique de mot de passe** (`passwordSchema`, `src/lib/zod.ts`) : 8 caractères
  minimum, au moins une majuscule, une minuscule, un chiffre et un caractère
  spécial ; rejet d'une liste de mots de passe usuels. Appliquée à la création
  (`POST /api/users`) et à la réinitialisation (`PATCH /api/users/[id]`).
- **Verrouillage de compte** (`src/lib/auth.ts`) : après 5 tentatives échouées,
  le compte est verrouillé 15 minutes. Un administrateur peut déverrouiller via
  `PATCH /api/users/[id]` (`{ "unlock": true }`).
- **Hachage** : bcrypt, coût 12 pour les comptes créés via l'API.
- **Aucune écriture anonyme** : `requireEdit`/`requireRole` exigent toujours une
  session valide (le contournement de développement a été supprimé).

## Comptes par défaut

- Les comptes de démonstration seedés (`admin@narsa.ma`, etc.) utilisent le mot
  de passe par défaut `demo1234`. **Ce mot de passe doit être changé avant toute
  mise en production** et le bloc de démonstration de la page de connexion doit
  rester masqué (`NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` non défini).
- Créer des comptes nominatifs via l'interface d'administration ; ne pas
  partager de compte générique.

## Reste à traiter (WAVE 3 — T3.1)

Chiffrement/RGS, en-têtes/HSTS avancés, campagne OWASP Top 10, signature
électronique. Voir `CONFORMITE.md` (exig. 37, 38).
