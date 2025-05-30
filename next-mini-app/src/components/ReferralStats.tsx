"use client"

import { useState, useEffect } from 'react';
import { useTranslation } from "@/src/components/TranslationProvider"; // ✅ Path corregido
import { supabase } from "@/src/lib/supabase";

interface ReferralStatsProps {
  userId: string;
}

export function ReferralStats({ userId }: ReferralStatsProps) {
  const { t } = useTranslation();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReferralEarnings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Obtener el total ganado por referidos
        const { data, error } = await supabase
          .from("referral_rewards")
          .select("reward_amount")
          .eq("referrer_id", userId);

        if (error) {
          console.error("Error fetching referral earnings:", error);
          setError(t("error_fetching_referral_earnings"));
        } else {
          // Calcular el total sumando todos los reward_amount
          const total = data.reduce((acc, reward) => acc + reward.reward_amount, 0);
          setTotalEarnings(total);
        }
      } catch (error) {
        console.error("Error general fetching referral earnings:", error);
        setError(t("error_processing_request"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralEarnings();
  }, [userId, t]);

  if (isLoading) {
    return <p>{t("loading_referral_earnings")}</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h4 className="text-xl font-semibold text-[#4ebd0a] mb-2">{t("referral_earnings")}</h4>
      <p className="text-4xl font-bold text-white">{totalEarnings.toLocaleString()} CDT</p>
      <p className="text-sm text-gray-400">{t("total_earned_from_referrals")}</p>
    </div>
  );
}