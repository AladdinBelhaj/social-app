import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from './ui/dropdown-menu'; // I should check if this exists, if not I'll use a simpler one
import { Home, Users, User, LogOut, MessageSquare } from 'lucide-react';

export const Navbar: React.FC = () => {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto flex h-14 items-center px-4">
                <div className="mr-8 flex">
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="font-bold text-xl tracking-tight text-primary">SocialMesh</span>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link to="/" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                                    <Home className="h-4 w-4" /> Feed
                                </Link>
                                <Link to="/friends" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                                    <Users className="h-4 w-4" /> Friends
                                </Link>
                                <Link to="/messages" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" /> Messages
                                </Link>

                                <div className="flex items-center gap-3 ml-4 border-l pl-4">
                                    <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={profile?.avatar_url} />
                                            <AvatarFallback>{profile?.username?.[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium hidden sm:inline-block">@{profile?.username}</span>
                                    </Link>
                                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm">Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
