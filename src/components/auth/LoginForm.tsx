import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import { Google } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await signInWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 space-y-6 bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLogin ? 'Bienvenue sur Calmi' : 'Créez votre compte Calmi'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          {isLogin ? 'Se connecter' : 'S\'inscrire'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
      >
        <Google className="mr-2 h-4 w-4" />
        Continuer avec Google
      </Button>

      <div className="text-center">
        <Button
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm"
        >
          {isLogin ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
        </Button>
      </div>
    </Card>
  );
};

export default LoginForm;