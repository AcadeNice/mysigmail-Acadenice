<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

defineOptions({ name: 'CguPage' })

const router = useRouter()

const lang = ref<'fr' | 'en'>('fr')
const isDark = ref<boolean>(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

function toggleLang() {
  lang.value = lang.value === 'fr' ? 'en' : 'fr'
}

function goBack() {
  // can be router.back(), but push('/') is easier to manage
  router.push('/')
}

function handleTheme(e: MediaQueryListEvent) {
  isDark.value = e.matches
}

onMounted(() => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.addEventListener?.('change', handleTheme)
})

onBeforeUnmount(() => {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
  mq?.removeEventListener?.('change', handleTheme)
})
</script>

<template>
  <div
    class="min-h-screen"
    :class="isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'"
  >
    <div class="fixed left-2 top-4 flex gap-2 z-50">
      <!-- back -->
      <button
        type="button"
        class="h-9 px-3 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm hover:shadow-md transition border cursor-pointer"
        :class="
          isDark
            ? 'border-gray-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
            : 'border-gray-300 bg-white text-slate-900 hover:bg-gray-50'
        "
        @click="goBack"
      >
        ← Retour
      </button>

      <!-- lang -->
      <button
        type="button"
        class="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm hover:shadow-md transition border cursor-pointer"
        :class="
          isDark
            ? 'border-gray-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
            : 'border-gray-300 bg-white text-slate-900 hover:bg-gray-50'
        "
        @click="toggleLang"
      >
        {{ lang === 'fr' ? 'FR' : 'EN' }}
      </button>
    </div>
    <div class="max-w-4xl mx-auto px-4 py-8 relative">
      <!-- ---------- VERSION FRANÇAISE ---------- -->
      <div v-if="lang === 'fr'">
        <h1 class="text-3xl font-semibold mb-6">
          Conditions générales d’utilisation et Politique de confidentialité
        </h1>

        <p class="text-sm text-muted-foreground mb-8">
          Cette page décrit les règles d’utilisation du service de génération de signature d’e-mail
          proposé par AcadéNice, ainsi que la manière dont vos données sont traitées. L’utilisation
          du service implique l’acceptation des présentes conditions.
        </p>

        <!-- 1. Présentation du Service -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            1. Présentation du Service
          </h2>
          <p class="mb-2">
            Le service (ci-après le « Service ») permet aux utilisateurs de créer et de
            personnaliser une signature d’e-mail professionnelle, puis de la copier ou de l’intégrer
            dans certains clients de messagerie, notamment Gmail.
          </p>
          <p>
            Le Service est mis à disposition gratuitement par AcadéNice et est principalement
            destiné à un usage dans le cadre académique et professionnel des utilisateurs concernés.
          </p>
        </section>

        <!-- 2. Accès et utilisation du Service -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            2. Accès et utilisation du Service
          </h2>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>L’utilisation du Service est <strong>gratuite</strong>.</li>
            <li>Le Service est accessible via un navigateur web compatible.</li>
            <li>
              Certaines fonctionnalités peuvent être réservées à des utilisateurs authentifiés (par
              exemple, personnel d’AcadéNice) disposant d’identifiants fournis ou validés par
              AcadéNice.
            </li>
          </ul>
          <p>
            L’utilisateur s’engage à utiliser le Service dans le respect des lois et règlements en
            vigueur, ainsi que des règles internes d’AcadéNice.
          </p>
        </section>

        <!-- 3. Données saisies dans la signature -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            3. Données saisies dans la signature
          </h2>
          <p class="mb-2">
            Les informations que vous saisissez dans les champs de la signature (nom, fonction,
            établissement, coordonnées, liens, bannière, réseaux sociaux, etc.) :
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li><strong>ne sont pas enregistrées sur nos serveurs</strong>&nbsp;;</li>
            <li>
              sont stockées uniquement <strong>en local dans votre navigateur</strong> (par exemple
              via des mécanismes de type cache ou <code>localStorage</code>)&nbsp;;
            </li>
            <li>
              ne sont utilisables que sur le poste et le navigateur où elles ont été configurées,
              sauf si vous les copiez ou exportez manuellement.
            </li>
          </ul>
          <p>
            Vous êtes seul responsable du contenu de votre signature (mentions obligatoires,
            exactitude des informations, absence de données sensibles, etc.).
          </p>
        </section>

        <!-- 4. Questionnaire initial et données côté serveur -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            4. Questionnaire initial et données stockées côté serveur
          </h2>
          <p class="mb-2">
            Avant la connexion et/ou l’accès complet au Service, un formulaire (questionnaire) peut
            vous être présenté. Les données saisies dans ce questionnaire :
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>sont <strong>enregistrées sur nos serveurs</strong>&nbsp;;</li>
            <li>
              sont utilisées <strong>exclusivement pour les besoins d’AcadéNice</strong>
              (gestion et administration du Service, statistiques internes non commerciales,
              amélioration de l’outil, suivi de son usage dans le cadre académique)&nbsp;;
            </li>
            <li>
              <strong>ne sont jamais transmises à des tiers</strong> à des fins commerciales ou de
              prospection&nbsp;;
            </li>
            <li>
              peuvent être communiquées uniquement :
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li>
                  aux services ou prestataires techniques agissant pour notre compte (hébergement,
                  maintenance, etc.), dans le cadre de contrats de sous-traitance encadrés&nbsp;;
                </li>
                <li>
                  ou si la loi l’exige (obligation légale, demande d’une autorité compétente, etc.).
                </li>
              </ul>
            </li>
          </ul>
          <p>
            La durée de conservation de ces données est limitée au temps nécessaire aux finalités
            ci-dessus, puis les données sont supprimées ou anonymisées.
          </p>
        </section>

        <!-- 5. Authentification et compte utilisateur -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            5. Authentification et compte utilisateur
          </h2>
          <p class="mb-2">
            Pour certaines fonctionnalités (par exemple, accès réservé au personnel ou configuration
            avancée), une authentification peut être requise.
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>
              Vos identifiants (mot de passe, codes d’accès) sont personnels et ne doivent pas être
              partagés.
            </li>
            <li>
              Des cookies techniques ou un mécanisme de session peuvent être utilisés pour maintenir
              votre connexion.
            </li>
            <li>
              En cas de suspicion d’usage frauduleux, vous devez en informer AcadéNice dans les
              meilleurs délais, selon les procédures internes.
            </li>
          </ul>
        </section>

        <!-- 6. Intégration avec Gmail et services Google -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            6. Intégration avec Gmail et services Google
          </h2>
          <p class="mb-2">
            Le Service peut proposer une intégration avec Gmail afin de synchroniser la signature
            créée avec votre compte Gmail et de la mettre à jour via l’API Gmail.
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>
              Le Service <strong>ne connaît jamais votre mot de passe Google</strong> :
              l’authentification se fait via les mécanismes fournis par Google (OAuth).
            </li>
            <li>
              Des jetons d’accès techniques (tokens) peuvent être stockés pour permettre la mise à
              jour de votre signature, dans le seul but de fournir les fonctionnalités décrites dans
              l’interface.
            </li>
            <li>
              Nous n’accédons pas au contenu de vos e-mails, ni à votre carnet d’adresses, en dehors
              de ce qui est strictement nécessaire au fonctionnement de la gestion de signature et
              dans la limite des permissions que vous avez accordées.
            </li>
            <li>
              Vous pouvez à tout moment révoquer cette autorisation dans les paramètres de votre
              compte Google et, le cas échéant, via les options de déconnexion proposées dans le
              Service.
            </li>
          </ul>
        </section>

        <!-- 7. Cookies et stockage local -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            7. Cookies et stockage local
          </h2>
          <p class="mb-2">
            Le Service peut utiliser des cookies techniques ou des mécanismes équivalents pour :
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>gérer les sessions d’authentification ;</li>
            <li>mémoriser certaines préférences (par exemple la langue) ;</li>
            <li>conserver localement la configuration de votre signature dans votre navigateur.</li>
          </ul>
          <p>
            Aucun cookie ou traceur n’est utilisé à des fins publicitaires ou de suivi marketing
            externe.
          </p>
        </section>

        <!-- 8. Bases juridiques -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            8. Bases juridiques du traitement
          </h2>
          <p class="mb-2">
            Les traitements de données personnelles mis en œuvre via le Service peuvent reposer
            notamment sur&nbsp;:
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>
              l’exécution d’une mission d’intérêt public ou relevant de l’autorité publique confiée
              à AcadéNice&nbsp;;
            </li>
            <li>
              l’intérêt légitime d’AcadéNice à gérer, sécuriser et améliorer ses outils
              numériques&nbsp;;
            </li>
            <li>
              le consentement de l’utilisateur, lorsque celui-ci est requis par la réglementation
              applicable.
            </li>
          </ul>
        </section>

        <!-- 9. Droits des personnes -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            9. Droits des personnes concernées
          </h2>
          <p class="mb-2">
            Conformément à la réglementation applicable en matière de protection des données, vous
            disposez notamment des droits suivants concernant vos données personnelles :
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>droit d’accès ;</li>
            <li>droit de rectification ;</li>
            <li>droit à l’effacement (dans les limites légales) ;</li>
            <li>droit à la limitation du traitement ;</li>
            <li>droit d’opposition, le cas échéant ;</li>
            <li>
              droit d’introduire une réclamation auprès de l’autorité de contrôle compétente (par
              exemple la CNIL en France).
            </li>
          </ul>
          <p>
            Pour exercer ces droits, vous pouvez contacter AcadéNice selon les canaux habituels de
            l’académie (coordonnées officielles, contacts dédiés à la protection des données, etc.).
          </p>
        </section>

        <!-- 10. Sécurité -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            10. Sécurité
          </h2>
          <p class="mb-2">
            Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables afin de
            protéger les données traitées dans le cadre du Service (contrôle d’accès,
            journalisation, sauvegardes, etc.).
          </p>
          <p>
            Toutefois, aucun système n’étant parfaitement sécurisé, l’utilisateur doit également
            prendre toutes les précautions utiles (poste de travail verrouillé, non-divulgation des
            identifiants, etc.).
          </p>
        </section>

        <!-- 11. Propriété intellectuelle et open-source -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            11. Propriété intellectuelle et composants open-source
          </h2>
          <p class="mb-2">
            Le Service s’appuie sur du code open-source, notamment le projet
            <strong>MySigMail</strong>, disponible publiquement sur GitHub. Ce projet a été modifié
            et adapté afin de répondre aux besoins des utilisateurs francophones et au contexte
            d’AcadéNice.
          </p>
          <p class="mb-2">
            L’utilisation et la copie du code open-source d’origine restent possibles dans les
            conditions définies par les licences open-source applicables à ces projets.
          </p>
          <p>
            En revanche, le code spécifique développé pour adapter et intégrer le Service dans le
            cadre du présent projet AcadéNice ne fait pas l’objet d’une mise à disposition publique
            et ne peut être reproduit, diffusé ou réutilisé sans autorisation préalable d’AcadéNice,
            sauf mention contraire explicite.
          </p>
        </section>

        <!-- 12. Responsabilité -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            12. Responsabilité
          </h2>
          <p class="mb-2">
            Le Service est fourni « en l’état », sans garantie de disponibilité continue ni
            d’absence totale d’erreurs.
          </p>
          <p>AcadéNice ne saurait être tenue responsable notamment :</p>
          <ul class="list-disc pl-5 space-y-1 mt-1">
            <li>
              d’un usage du Service non conforme aux présentes conditions ou aux règles internes de
              l’académie ;
            </li>
            <li>
              de tout dommage résultant d’une mauvaise configuration ou d’un contenu inapproprié de
              la signature ;
            </li>
            <li>
              de la perte de données stockées localement dans le navigateur (effacement du cache,
              changement de poste, etc.).
            </li>
          </ul>
        </section>

        <!-- 13. Modifications -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            13. Modifications des conditions et de la politique de confidentialité
          </h2>
          <p class="mb-2">
            Les présentes conditions et la présente politique de confidentialité peuvent être mises
            à jour pour tenir compte de l’évolution du Service ou du cadre légal.
          </p>
          <p>
            En cas de modification substantielle, une information pourra être affichée sur le
            Service. La version applicable est celle en vigueur au moment de votre utilisation.
          </p>
        </section>

        <!-- 14. Contact -->
        <section class="mb-4">
          <h2 class="text-xl font-semibold mb-2">
            14. Contact
          </h2>
          <p>
            Pour toute question relative aux présentes conditions ou à la protection des données
            dans le cadre du Service, vous pouvez vous adresser à AcadéNice via les canaux de
            contact officiels.
          </p>
        </section>
      </div>

      <!-- ---------- ENGLISH VERSION ---------- -->
      <div v-else>
        <h1 class="text-3xl font-semibold mb-6">
          Terms of Use and Privacy Policy
        </h1>

        <p class="text-sm text-muted-foreground mb-8">
          This page describes the rules for using the e-mail signature generation service provided
          by AcadéNice, as well as how your data is processed. By using the service, you agree to
          these terms.
        </p>

        <!-- 1. Service overview -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            1. Service overview
          </h2>
          <p class="mb-2">
            The service (hereinafter the “Service”) allows users to create and customize a
            professional e-mail signature and then copy it or integrate it into certain e-mail
            clients, including Gmail.
          </p>
          <p>
            The Service is provided free of charge by AcadéNice and is primarily intended for
            academic and professional use by the relevant users.
          </p>
        </section>

        <!-- 2. Access and use of the Service -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            2. Access and use of the Service
          </h2>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>Use of the Service is <strong>free of charge</strong>.</li>
            <li>The Service is accessible via a compatible web browser.</li>
            <li>
              Some features may be reserved for authenticated users (for example, staff members of
              AcadéNice) with credentials provided or validated by AcadéNice.
            </li>
          </ul>
          <p>
            Users agree to use the Service in compliance with applicable laws and regulations, as
            well as with AcadéNice’s internal rules.
          </p>
        </section>

        <!-- 3. Data entered in the signature -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            3. Data entered in the signature
          </h2>
          <p class="mb-2">
            The information you enter in the signature fields (name, job title, institution, contact
            details, links, banner, social networks, etc.):
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>is <strong>not stored on our servers</strong>;</li>
            <li>
              is stored only <strong>locally in your browser</strong> (for example using cache
              mechanisms or <code>localStorage</code>);
            </li>
            <li>
              can only be used on the device and in the browser where it was configured, unless you
              copy or export it manually.
            </li>
          </ul>
          <p>
            You are solely responsible for the content of your signature (mandatory legal notices,
            accuracy of the information, absence of sensitive data, etc.).
          </p>
        </section>

        <!-- 4. Initial questionnaire and server-side data -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            4. Initial questionnaire and server-side data
          </h2>
          <p class="mb-2">
            Before logging in and/or gaining full access to the Service, you may be presented with a
            form (questionnaire). The data you enter in this questionnaire:
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>is <strong>stored on our servers</strong>;</li>
            <li>
              is used <strong>exclusively for the needs of AcadéNice</strong> (management and
              administration of the Service, internal non-commercial statistics, improvement of the
              tool, monitoring of its use in the academic context);
            </li>
            <li>
              is <strong>never shared with third parties</strong> for commercial or marketing
              purposes;
            </li>
            <li>
              may be disclosed only:
              <ul class="list-disc pl-5 mt-1 space-y-1">
                <li>
                  to technical services or providers acting on our behalf (hosting, maintenance,
                  etc.) under appropriate data-processing agreements;
                </li>
                <li>
                  or where required by law (legal obligation, request from a competent authority,
                  etc.).
                </li>
              </ul>
            </li>
          </ul>
          <p>
            The data retention period is limited to what is necessary for the purposes described
            above, after which the data is deleted or anonymised.
          </p>
        </section>

        <!-- 5. Authentication and user account -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            5. Authentication and user account
          </h2>
          <p class="mb-2">
            Certain features (for example, staff-only access or advanced configuration) may require
            authentication.
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>
              Your login credentials (password, access codes) are personal and must not be shared.
            </li>
            <li>
              Technical cookies or a session mechanism may be used to maintain your login session.
            </li>
            <li>
              If you suspect fraudulent use, you must inform AcadéNice as soon as possible via the
              internal procedures.
            </li>
          </ul>
        </section>

        <!-- 6. Integration with Gmail and Google services -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            6. Integration with Gmail and Google services
          </h2>
          <p class="mb-2">
            The Service may offer integration with Gmail in order to synchronize the created
            signature with your Gmail account and update it via the Gmail API.
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>
              The Service <strong>never knows your Google password</strong>: authentication is
              performed via the mechanisms provided by Google (OAuth).
            </li>
            <li>
              Technical access tokens may be stored to allow your signature to be updated, solely
              for the purpose of providing the features described in the interface.
            </li>
            <li>
              We do not access the content of your e-mails or your address book beyond what is
              strictly necessary for signature management and within the limits of the permissions
              you have granted.
            </li>
            <li>
              You may revoke this authorisation at any time in your Google account settings and,
              where applicable, using the logout options provided in the Service.
            </li>
          </ul>
        </section>

        <!-- 7. Cookies and local storage -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            7. Cookies and local storage
          </h2>
          <p class="mb-2">
            The Service may use technical cookies or similar mechanisms in order to:
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>manage authentication sessions;</li>
            <li>remember certain preferences (for example language settings);</li>
            <li>store your signature configuration locally in your browser.</li>
          </ul>
          <p>No cookies or trackers are used for advertising or external marketing purposes.</p>
        </section>

        <!-- 8. Legal bases for processing -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            8. Legal bases for processing
          </h2>
          <p class="mb-2">
            The processing of personal data carried out via the Service may be based in particular
            on:
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>
              the performance of a task carried out in the public interest or in the exercise of
              official authority vested in AcadéNice;
            </li>
            <li>
              the legitimate interest of AcadéNice in managing, securing and improving its digital
              tools;
            </li>
            <li>the user’s consent, where required under applicable data protection law.</li>
          </ul>
        </section>

        <!-- 9. Rights of data subjects -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            9. Rights of data subjects
          </h2>
          <p class="mb-2">
            In accordance with applicable data protection regulations, you have in particular the
            following rights with regard to your personal data:
          </p>
          <ul class="list-disc pl-5 space-y-1 mb-2">
            <li>right of access;</li>
            <li>right to rectification;</li>
            <li>right to erasure (within the limits provided by law);</li>
            <li>right to restriction of processing;</li>
            <li>right to object, where applicable;</li>
            <li>
              right to lodge a complaint with the competent supervisory authority (for example the
              CNIL in France).
            </li>
          </ul>
          <p>
            To exercise these rights, you may contact AcadéNice using the academy’s usual contact
            channels (official contact details, data protection contacts, etc.).
          </p>
        </section>

        <!-- 10. Security -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            10. Security
          </h2>
          <p class="mb-2">
            We implement reasonable technical and organisational measures to protect data processed
            through the Service (access control, logging, backups, etc.).
          </p>
          <p>
            However, as no system is completely secure, users must also take all necessary
            precautions (locking their workstation, not disclosing their credentials, and so on).
          </p>
        </section>

        <!-- 11. Intellectual property and open-source components -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            11. Intellectual property and open-source components
          </h2>
          <p class="mb-2">
            The Service relies on open-source code, in particular the
            <strong>MySigMail</strong> project, which is publicly available on GitHub. This project
            has been modified and adapted to meet the needs of French-speaking users and the context
            of AcadéNice.
          </p>
          <p class="mb-2">
            Use and copying of the original open-source code remain possible under the terms of the
            open-source licences applicable to these projects.
          </p>
          <p>
            However, the specific code developed to adapt and integrate the Service within the
            present AcadéNice project is not made publicly available and may not be reproduced,
            distributed or reused without the prior authorisation of AcadéNice, unless explicitly
            stated otherwise.
          </p>
        </section>

        <!-- 12. Liability -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            12. Liability
          </h2>
          <p class="mb-2">
            The Service is provided “as is”, without any guarantee of continuous availability or
            complete absence of errors.
          </p>
          <p>AcadéNice cannot be held liable in particular for:</p>
          <ul class="list-disc pl-5 space-y-1 mt-1">
            <li>
              any use of the Service that does not comply with these terms or with the academy’s
              internal rules;
            </li>
            <li>
              any damage resulting from incorrect configuration or inappropriate content of the
              signature;
            </li>
            <li>
              loss of data stored locally in the browser (cache clearing, change of device, etc.).
            </li>
          </ul>
        </section>

        <!-- 13. Changes to these terms and the privacy policy -->
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">
            13. Changes to these terms and the privacy policy
          </h2>
          <p class="mb-2">
            These terms and this privacy policy may be updated to reflect changes in the Service or
            in the legal framework.
          </p>
          <p>
            In the event of any material change, a notice may be displayed in the Service. The
            applicable version is the one in force at the time you use the Service.
          </p>
        </section>

        <!-- 14. Contact -->
        <section class="mb-4">
          <h2 class="text-xl font-semibold mb-2">
            14. Contact
          </h2>
          <p>
            If you have any questions about these terms or about data protection in the context of
            the Service, you can contact AcadéNice via the academy’s official contact channels.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
