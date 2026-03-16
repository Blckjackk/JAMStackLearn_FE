import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type UserAvatarProps = {
  initials: string
  size?: "default" | "sm" | "lg"
}

function UserAvatar({ initials, size = "default" }: UserAvatarProps) {
  return (
    <Avatar size={size}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

export { UserAvatar }
