import { createServerSupabaseClient } from "./client";

/**
 * 從 Supabase 獲取精選酒款
 */
export async function getFeaturedWines(limit: number = 4) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from("wines")
      .select(`
        *,
        wineries (
          id,
          nameZh,
          nameEn,
          logoUrl
        )
      `)
      .eq("published", true)
      .eq("featured", true)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase error fetching wines:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching wines from Supabase:", error);
    return [];
  }
}

/**
 * 從 Supabase 獲取精選酒莊
 */
export async function getFeaturedWineries() {
  try {
    const supabase = createServerSupabaseClient();
    
    // 獲取酒莊
    const { data: wineries, error: wineriesError } = await supabase
      .from("wineries")
      .select("*")
      .eq("featured", true)
      .order("createdAt", { ascending: false });

    if (wineriesError) {
      console.error("Supabase error fetching wineries:", wineriesError);
      return [];
    }

    if (!wineries || wineries.length === 0) {
      return [];
    }

    // 為每個酒莊獲取酒款數量
    const wineriesWithCount = await Promise.all(
      wineries.map(async (winery) => {
        const { count } = await supabase
          .from("wines")
          .select("*", { count: "exact", head: true })
          .eq("wineryId", winery.id)
          .eq("published", true);

        return {
          ...winery,
          wineCount: count || 0,
        };
      })
    );

    return wineriesWithCount;
  } catch (error) {
    console.error("Error fetching wineries from Supabase:", error);
    return [];
  }
}

/**
 * 從 Supabase 獲取單個酒款
 */
export async function getWineById(id: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from("wines")
      .select(`
        *,
        wineries (
          id,
          nameZh,
          nameEn,
          logoUrl,
          region,
          country
        )
      `)
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error) {
      console.error("Supabase error fetching wine:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching wine from Supabase:", error);
    return null;
  }
}

/**
 * 從 Supabase 獲取單個酒莊
 */
export async function getWineryById(id: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from("wineries")
      .select(`
        *,
        wines (
          id,
          nameZh,
          nameEn,
          price,
          mainImageUrl,
          vintage
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Supabase error fetching winery:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching winery from Supabase:", error);
    return null;
  }
}

