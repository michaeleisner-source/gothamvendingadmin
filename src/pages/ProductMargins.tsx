import { Header } from "@/components/ui/Header";
import { FiltersBar } from "@/components/ui/FiltersBar";
import { SummaryCards } from "@/components/ui/SummaryCards";
import { DataTable } from "@/components/ui/DataTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeMargins, money, pct } from "@/lib/utils";

export default function ProductMargins() {
  const { data: marginData, isLoading } = useQuery({
    queryKey: ['product-margins'],
    queryFn: async () => {
      // Get products with their cost/price info
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (productsError) throw productsError;

      // Get sales data for the last 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('product_id, qty, unit_price_cents, unit_cost_cents, occurred_at')
        .gte('occurred_at', ninetyDaysAgo);

      if (salesError) console.warn('Sales data not available:', salesError);

       // Calculate margins for each product
       const productMargins = (products || []).map(product => {
         const { price, cost, marginDollar, marginPct } = computeMargins(
           (product.price || 0) * 100, // Convert to cents
           (product.cost || 0) * 100   // Convert to cents
         );

         // Get sales data for this product
         const productSales = (salesData || []).filter(sale => sale.product_id === product.id);
         const totalQty = productSales.reduce((sum, sale) => sum + sale.qty, 0);
         const velocity = totalQty / 90; // Units per day over 90 days

         return [
           product.sku || '',
           product.name,
           money(price),
           money(cost),
           money(0), // Card Fee - TODO: Calculate actual card fees if needed
           money(0), // Commission Alloc - TODO: Calculate actual commission if needed
           money(marginDollar),
           velocity.toFixed(2)
         ];
       });

       // Calculate summary metrics for summary cards
       const validProducts = (products || []).filter(p => (p.price || 0) > 0);
       const avgMargin = validProducts.length > 0 
         ? validProducts.reduce((sum, p) => {
             const { marginDollar } = computeMargins((p.price || 0) * 100, (p.cost || 0) * 100);
             return sum + marginDollar;
           }, 0) / validProducts.length
         : 0;
       
       const topPerformer = validProducts.length > 0
         ? validProducts.reduce((max, p) => {
             const { marginDollar: pMargin } = computeMargins((p.price || 0) * 100, (p.cost || 0) * 100);
             const { marginDollar: maxMargin } = computeMargins((max.price || 0) * 100, (max.cost || 0) * 100);
             return pMargin > maxMargin ? p : max;
           }).name
         : '—';

       const bottomPerformer = validProducts.length > 0
         ? validProducts.reduce((min, p) => {
             const { marginDollar: pMargin } = computeMargins((p.price || 0) * 100, (p.cost || 0) * 100);
             const { marginDollar: minMargin } = computeMargins((min.price || 0) * 100, (min.cost || 0) * 100);
             return pMargin < minMargin ? p : min;
           }).name
         : '—';

       return {
         products: productMargins,
         avgMargin: money(avgMargin),
         topPerformer,
         bottomPerformer,
         spoilage: '$0' // TODO: Calculate actual spoilage if tracked
       };
    }
  });

  const { products = [], avgMargin = '$—', topPerformer = '—', bottomPerformer = '—', spoilage = '$—' } = marginData || {};

  return (
    <div className="p-4 space-y-4">
      <Header title="Product Margins" subtitle="Net profit per SKU after all fees" />
      <FiltersBar />
      <SummaryCards items={[
        { label: 'Avg Unit Margin', value: avgMargin },
        { label: 'Top Performer', value: topPerformer },
        { label: 'Bottom Performer', value: bottomPerformer },
        { label: 'Spoilage (period)', value: spoilage },
      ]} />
      <DataTable
        columns={["SKU", "Product", "Price", "Landed Cost", "Card Fee", "Commission Alloc.", "Net Margin", "Velocity (units/day)"]}
        data={products}
        loading={isLoading}
      />
    </div>
  );
}