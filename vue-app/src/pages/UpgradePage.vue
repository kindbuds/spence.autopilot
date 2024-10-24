<template>
  <v-main :class="isMdAndUp ? 'pa-6' : 'pa-1'" class="pb-8">
    <!-- <table class="ma-6">
      <thead>
        <tr>
          <th>Plan</th>
          <th>Price</th>
          <th>Job Matches per Day</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Free</td>
          <td>$0</td>
          <td>20</td>
        </tr>
        <tr>
          <td>Standard - monthly</td>
          <td>$19.99</td>
          <td>100</td>
        </tr>
        <tr>
          <td>Premium - monthly</td>
          <td>$29.99</td>
          <td>250</td>
        </tr>
        <tr>
          <td>Pack A</td>
          <td>$4.99</td>
          <td>250</td>
        </tr>
        <tr>
          <td>Pack B</td>
          <td>$9.99</td>
          <td>500</td>
        </tr>
      </tbody>
    </table> -->

    <v-container class="mb-14">
      <v-alert
        color="teal-lighten-3"
        variant="tonal"
        :class="isMdAndUp ? 'ma-6 mt-0' : 'my-6'"
      >
        <h2 class="headline mb-0">Thank You for Your Support!</h2>
        <p class="subtitle-1">
          We're excited to help you land your next great opportunity. Upgrade
          your plan or add more job matches to keep the momentum going!
        </p>
      </v-alert>
      <!-- Upgrade Packs Section -->
      <v-row justify="center" :class="isMdAndUp ? 'mx-10' : ''" class="mt-10">
        <v-col cols="12">
          <h2 class="text-left">
            <v-icon
              size="small"
              icon="mdi-arrow-up-bold"
              color="rgb(124 124 124)"
              class="mb-1 mr-1"
            ></v-icon>
            Upgrade Packs
          </h2>
          <p class="pa-3 text-grey">
            More job matches increase your chances of landing the perfect job.
          </p>
        </v-col>

        <UpgradePackCard
          v-for="(pack, index) in upgradePacks"
          :key="index"
          :pack="pack"
          @purchase="handleUpgrade"
        />
      </v-row>
      <v-divider :class="isMdAndUp ? 'mx-10' : ''" class="mt-14" />
      <v-row justify="center" :class="isMdAndUp ? 'mx-10' : ''" class="mt-10">
        <v-col cols="12">
          <h2 class="text-left">
            <v-icon
              size="small"
              icon="mdi-shield-check-outline"
              color="rgb(124 124 124)"
              class="mb-1 mr-1"
            ></v-icon>
            Subscription Plans
          </h2>
          <p class="pa-3 text-grey">
            Unlock more daily job matches to maximize your opportunities.
          </p>
        </v-col>
        <!-- Iterate over plans to create plan cards -->
        <PlanCard
          v-for="(plan, index) in plans"
          :key="index"
          :plan="plan"
          @upgrade="handleUpgrade"
        />
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
// import * as shared from "@/helpers/shared.js";
// import { loadStripe } from "@stripe/stripe-js";
import { computed } from "vue";
import { useDisplay } from "vuetify";

import PlanCard from "@/components/upgrade/PlanCard.vue";
import UpgradePackCard from "@/components/upgrade/UpgradePackCard.vue";

export default {
  name: "UpgradePage",
  setup() {
    const display = useDisplay();
    const isMdAndUp = computed(() => display.mdAndUp.value);
    return {
      isMdAndUp,
    };
  },
  components: {
    PlanCard,
    UpgradePackCard,
  },
  data() {
    return {
      sessionID: null, // Store session ID if needed
      isPolling: false, // Control polling state
      pollingInterval: null, // To store interval reference for cleanup

      plans: [
        {
          name: "Essential Plan",
          price: 19.99,
          jobMatches: 100,
          billingCycle: "monthly",
          priceId: "price_1QCREvJUTfh95zTgRagihd0C",
          // features: [
          //   "Daily Job Recommendations",
          //   "Priority Application Insights",
          // ],
        },
        {
          name: "Pro Plan",
          price: 39.99,
          jobMatches: 250,
          billingCycle: "monthly",
          priceId: "price_1QCUW6JUTfh95zTggFYoFQnn",
          // features: [
          //   "Daily Job Recommendations",
          //   "Priority Application Insights",
          //   "Resume Optimization",
          // ],
        },
      ],
      upgradePacks: [
        {
          name: "Boost 250",
          price: 4.99,
          jobMatches: 250,
          link: "https://buy.stripe.com/bIY4hA9P7ccm3MQ8ww",
        },
        {
          name: "Boost 500",
          price: 9.99,
          jobMatches: 500,
          link: "https://buy.stripe.com/eVa9BU3qJfoy4QUfYZ",
        },
      ],
    };
  },

  async mounted() {
    if (window.electron) {
      if (window.electron.onSubscriptionUpdated) {
        window.electron.onSubscriptionUpdated(async (jobData) => {
          // console.log("Received new job data in component!:", jobData);
          await this.processData(jobData);
        });
      }

      window.electron.reloadUser(this.user.token);
      window.electron.onUserReloaded(async (event, userdata) => {
        console.log(event, userdata, "onUserReloaded");
      });
    }
  },
  methods: {
    async handleUpgrade(upgrade) {
      if (upgrade && upgrade.link) {
        window.electron.openUrl(
          `${upgrade.link}?client_reference_id=${encodeURIComponent(
            this.user.userid
          )}&prefilled_email=${encodeURIComponent(this.user.email)}`
        );
      } else {
        // open stripe checkout url for subscription
        const payload = {
          customerId: "cus_R51r9jQ7mXBEGq",
          priceId: upgrade.priceId,
          subscriptionId: "sub_1QCshfJUTfh95zTgq6XqZGz0",
          subscriptionItemId: "si_R52nIYcOmCZq7T",
        };
        console.log(payload, "handleUpgrade");
        const checkResponse = await window.electron.createCheckoutLink(payload);
        console.log(checkResponse, "checkResponse");
        if (checkResponse && checkResponse.checkout_url) {
          window.electron.openUrl(checkResponse.checkout_url);
        }
      }
      this.startPollingForCheckoutCompletion();
    },
    // Polling function for checkout completion
    async pollForCheckoutCompletion() {
      console.log("pollForCheckoutCompletion");

      try {
        const checkResponse = await window.electron.checkCheckoutCompletion();
        if (checkResponse && checkResponse.completed) {
          console.log("Checkout completed!");
          this.stopPolling(); // Stop polling after completion
          // Handle successful checkout here (e.g., update UI, show confirmation)
        } else {
          console.log("Polling for checkout completion...");
        }
      } catch (error) {
        console.error("Error while polling for checkout:", error);
        this.stopPolling(); // Stop polling if there is an error
      }
    },

    // Start polling function
    startPollingForCheckoutCompletion() {
      if (this.isPolling) return;
      this.isPolling = true;
      this.pollingInterval = setInterval(this.pollForCheckoutCompletion, 5000); // Poll every 5 seconds
    },

    // Stop polling function (cleanup)
    stopPolling() {
      this.isPolling = false;
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },
  },

  // Clean up polling on component unmount
  beforeUnmount() {
    this.stopPolling(); // Ensure polling stops when component is destroyed
  },
};
</script>


<style scoped>
.v-card {
  border-color: grey !important;
  margin-bottom: 20px;
}

.v-card-title {
  font-size: 1.25rem;
  font-weight: bold;
}

.v-card-subtitle {
  font-size: 1.1rem;
  color: #757575;
}

.upgrade-packs-section {
  padding: 20px;
  border-radius: 8px;
}

.subscription-plans-section {
  background-color: #e9ecef;
  padding: 20px;
  border-radius: 8px;
}
.support-callout {
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 20px;
}

table {
  width: 50vw;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #777;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #383838;
}
</style>