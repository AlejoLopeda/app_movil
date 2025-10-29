<template>
  <ion-page class="auth-email" mode="ios">
    <ion-header translucent>
      <ion-toolbar class="auth-email__toolbar">
        <ion-title class="auth-page__title">Términos y Condiciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="auth-email__content" mode="ios" style="--padding-top: var(--ion-safe-area-top);">
      <section class="auth-email__wrapper">
        <ion-card class="app-account__card" mode="ios">
          <ion-card-content>
            <article class="terms">
              <h2>Política de Privacidad</h2>
              <p><strong>Última actualización:</strong> {{ lastUpdate }}</p>

              <p>Esta Política de Privacidad describe cómo se recopila, utiliza y protege la información personal y técnica de los usuarios que utilizan esta aplicación. Al usar la aplicación, el usuario acepta los términos establecidos en esta Política.</p>

              <h3>1. Información que se recopila</h3>
              <p>La aplicación puede recopilar los siguientes tipos de información, dependiendo de las funcionalidades que el usuario utilice:</p>
              <ul>
                <li><strong>Información personal:</strong> datos proporcionados directamente por el usuario, como nombre, correo electrónico u otra información de contacto (si la aplicación lo solicita).</li>
                <li><strong>Imágenes y archivos multimedia:</strong> cuando el usuario utiliza la cámara o el almacenamiento para capturar, subir o guardar contenido dentro de la aplicación.</li>
                <li><strong>Datos de uso:</strong> información técnica sobre la interacción del usuario con la aplicación, como el tipo de dispositivo, versión del sistema operativo, identificadores anónimos y datos de rendimiento.</li>
                <li><strong>Ubicación:</strong> si la aplicación requiere acceder a la ubicación del usuario, esta se utilizará únicamente para ofrecer funciones específicas y no se compartirá con terceros sin autorización.</li>
              </ul>

              <h3>2. Uso de la información</h3>
              <ul>
                <li>Permitir el correcto funcionamiento de la aplicación y sus características.</li>
                <li>Mejorar la experiencia del usuario y optimizar el rendimiento del servicio.</li>
                <li>Corregir errores, actualizar funciones y garantizar la seguridad de la aplicación.</li>
                <li>Cumplir con obligaciones legales o responder a requerimientos de autoridades competentes.</li>
              </ul>
              <p>En ningún caso la información personal será vendida, alquilada o compartida con terceros sin el consentimiento explícito del usuario.</p>

              <h3>3. Permisos del dispositivo</h3>
              <ul>
                <li><strong>Cámara:</strong> para tomar fotografías o grabar videos.</li>
                <li><strong>Almacenamiento:</strong> para guardar o recuperar archivos generados por el usuario.</li>
                <li><strong>Ubicación:</strong> para ofrecer servicios basados en la posición geográfica.</li>
                <li><strong>Micrófono:</strong> para grabar audio (si la aplicación lo requiere).</li>
                <li><strong>Conexión a internet:</strong> para sincronizar datos o acceder a contenido en línea.</li>
              </ul>

              <h3>4. Protección de la información</h3>
              <p>Se implementan medidas técnicas y organizativas razonables para proteger la información del usuario contra accesos no autorizados, pérdida, alteración o divulgación indebida. Aun así, el usuario reconoce que ninguna transmisión o almacenamiento de datos en línea es completamente seguro, por lo que utiliza la aplicación bajo su propio riesgo.</p>

              <h3>5. Conservación de los datos</h3>
              <p>Los datos personales serán conservados únicamente durante el tiempo necesario para cumplir con los fines descritos en esta Política, o según lo exija la legislación aplicable. Una vez cumplido ese plazo, la información será eliminada de manera segura.</p>

              <h3>6. Derechos del usuario</h3>
              <ul>
                <li>Acceder, rectificar o eliminar sus datos personales.</li>
                <li>Retirar su consentimiento para el tratamiento de la información.</li>
                <li>Solicitar detalles sobre el uso que se hace de sus datos.</li>
              </ul>
              <p>Para ejercer estos derechos, el usuario puede contactar al desarrollador a través del medio de contacto oficial indicado en la aplicación.</p>

              <h3>7. Enlaces y contenido de terceros</h3>
              <p>La aplicación puede contener enlaces o integraciones a servicios externos. Esta Política de Privacidad no aplica a dichos servicios, por lo que se recomienda revisar sus políticas de privacidad antes de utilizarlos.</p>

              <h3>8. Cambios en esta Política</h3>
              <p>El titular de la aplicación puede actualizar o modificar esta Política de Privacidad en cualquier momento. Cualquier cambio será notificado dentro de la aplicación o mediante los canales oficiales, indicando la fecha de la última actualización.</p>

              <h3>9. Contacto</h3>
              <p>Para consultas, solicitudes o reclamos relacionados con esta Política de Privacidad, el usuario puede comunicarse a través de los medios de contacto proporcionados dentro de la aplicación o en el sitio web del desarrollador.</p>
            </article>

            <div class="terms__actions">
              <ion-button fill="clear" class="terms__btn" @click="goBack">Cancelar</ion-button>
              <ion-button class="terms__btn terms__btn--ok" @click="acceptTerms">Aceptar</ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonButton } from '@ionic/vue'
import { useRouter, useRoute } from 'vue-router'
import '@/theme/AuthPage.css'

const router = useRouter()
const route = useRoute()

const lastUpdate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

function goBack() {
  router.back()
}

function acceptTerms() {
  // Si venimos desde registro, al volver marcamos el checkbox con query
  const from = String(route.query.from || '')
  if (from === 'register') {
    router.replace({ name: 'Register', query: { accepted: '1' } })
  } else {
    router.back()
  }
}
</script>

<style scoped>
.terms {
  display: grid;
  gap: 10px;
  color: #0d0d0d;
}
.terms h2 { margin: 0 0 6px 0; color: #0d3f48; font-weight: 800; }
.terms h3 { margin: 10px 0 4px 0; color: #0d3f48; font-weight: 800; }
.terms p { margin: 0; line-height: 1.55; }
.terms ul { margin: 0 0 8px 18px; }
/* Acciones */
.terms__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
.terms__btn { --color: #0d3f48; font-weight: 700; }
.terms__btn--ok { --background: #cbdcff; --color: #0d2c33; border-radius: 999px; }
</style>
