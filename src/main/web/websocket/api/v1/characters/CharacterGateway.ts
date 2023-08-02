/*
@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class CharacterGateway implements OnModuleInit {
  @WebSocketServer() server: Server

  constructor(private characterService: CharacterService) {}

  onModuleInit(): any {
    this.server.on('connect', (socket) => {
      console.log(socket.id)
      console.log('Connected')
    })
  }

  @SubscribeMessage('updateCharacter')
  async getSseCharacter(@ConnectedSocket() client: Socket, @MessageBody() request: WsCharacterRequest): Promise<void> {
    try {
      const character = await this.characterService.findByName(request.name)
      this.server.emit(character.name, CharacterVM.of({ character: character }) as any)
    } catch (e) {
      throw new WsException(e)
    }
  }
}
*/
