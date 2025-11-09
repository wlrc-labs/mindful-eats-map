-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'suspended', 'cancelled');

-- Create enum for establishment types
CREATE TYPE public.establishment_type AS ENUM ('mercado', 'restaurante', 'loja', 'padaria', 'cafeteria');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create tenants table (mercados, restaurantes, etc)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type establishment_type NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan subscription_plan DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  price DECIMAL(10, 2),
  payment_gateway TEXT,
  payment_method TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create dietary restrictions table
CREATE TABLE public.dietary_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.product_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  image_url TEXT,
  nutrition_info JSONB,
  ingredients TEXT[],
  allergens TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create product restrictions table (many-to-many)
CREATE TABLE public.product_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  restriction_id UUID REFERENCES public.dietary_restrictions(id) ON DELETE CASCADE NOT NULL,
  is_safe BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (product_id, restriction_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user dietary profile table
CREATE TABLE public.user_dietary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  restrictions UUID[] DEFAULT ARRAY[]::UUID[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create dashboard widgets table
CREATE TABLE public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  widget_type TEXT NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 4}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dietary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants WHERE owner_id = _user_id LIMIT 1;
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tenants
CREATE POLICY "Admins can view all tenants"
  ON public.tenants FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can view their tenant"
  ON public.tenants FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can insert tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can update their tenant"
  ON public.tenants FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can update any tenant"
  ON public.tenants FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can view their subscription"
  ON public.subscriptions FOR SELECT
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for dietary_restrictions (public read)
CREATE POLICY "Anyone can view dietary restrictions"
  ON public.dietary_restrictions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage dietary restrictions"
  ON public.dietary_restrictions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for product_categories (public read)
CREATE POLICY "Anyone can view product categories"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product categories"
  ON public.product_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can manage their products"
  ON public.products FOR ALL
  USING (tenant_id = public.get_user_tenant(auth.uid()));

-- RLS Policies for product_restrictions
CREATE POLICY "Anyone can view product restrictions"
  ON public.product_restrictions FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage their product restrictions"
  ON public.product_restrictions FOR ALL
  USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE tenant_id = public.get_user_tenant(auth.uid())
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Tenants can view orders for their establishment"
  ON public.orders FOR SELECT
  USING (tenant_id = public.get_user_tenant(auth.uid()));

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Tenants can update orders for their establishment"
  ON public.orders FOR UPDATE
  USING (tenant_id = public.get_user_tenant(auth.uid()));

-- RLS Policies for order_items
CREATE POLICY "Users can view items from their orders"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view items from their orders"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE tenant_id = public.get_user_tenant(auth.uid())
    )
  );

CREATE POLICY "Users can insert items to their orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for user_dietary_profiles
CREATE POLICY "Users can view their own dietary profile"
  ON public.user_dietary_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their dietary profile"
  ON public.user_dietary_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their dietary profile"
  ON public.user_dietary_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for dashboard_widgets
CREATE POLICY "Tenants can manage their widgets"
  ON public.dashboard_widgets FOR ALL
  USING (tenant_id = public.get_user_tenant(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_dietary_profiles_updated_at
  BEFORE UPDATE ON public.user_dietary_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default dietary restrictions
INSERT INTO public.dietary_restrictions (code, name, description, severity, icon) VALUES
  ('celiac', 'Doença Celíaca', 'Intolerância permanente ao glúten', 'severe', 'wheat-off'),
  ('lactose', 'Intolerância à Lactose', 'Dificuldade em digerir lactose', 'moderate', 'milk-off'),
  ('aplv', 'APLV', 'Alergia à Proteína do Leite de Vaca', 'severe', 'beef-off'),
  ('diabetes', 'Diabetes', 'Controle de açúcar no sangue', 'moderate', 'candy-off'),
  ('vegan', 'Vegano', 'Sem produtos de origem animal', 'mild', 'leaf'),
  ('vegetarian', 'Vegetariano', 'Sem carne', 'mild', 'salad'),
  ('nut-allergy', 'Alergia a Nozes', 'Alergia a amendoim e nozes', 'severe', 'nut-off'),
  ('shellfish', 'Alergia a Frutos do Mar', 'Alergia a camarão, siri, etc', 'severe', 'fish-off'),
  ('low-sodium', 'Baixo Sódio', 'Dieta com restrição de sal', 'moderate', 'salt-off'),
  ('renal', 'Doença Renal', 'Dieta para pacientes renais', 'severe', 'heart-pulse');

-- Insert default product categories
INSERT INTO public.product_categories (name, description, icon) VALUES
  ('Panificação', 'Pães, bolos e produtos de padaria', 'croissant'),
  ('Laticínios', 'Leites, queijos e derivados', 'milk'),
  ('Carnes', 'Carnes, aves e peixes', 'beef'),
  ('Frutas e Verduras', 'Produtos frescos', 'apple'),
  ('Grãos e Cereais', 'Arroz, feijão, massas', 'wheat'),
  ('Bebidas', 'Sucos, refrigerantes, águas', 'cup-soda'),
  ('Congelados', 'Produtos congelados', 'snowflake'),
  ('Doces', 'Chocolates, balas, sobremesas', 'candy'),
  ('Snacks', 'Salgadinhos e petiscos', 'popcorn'),
  ('Condimentos', 'Temperos, molhos, óleos', 'pepper');